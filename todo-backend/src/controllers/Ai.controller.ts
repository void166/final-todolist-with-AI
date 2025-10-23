import { Response, Request } from "express";
import { config } from "../config";
import { parse } from "dotenv";
import Anthropic from '@anthropic-ai/sdk';
import { Stream } from "@anthropic-ai/sdk/core/streaming.js";

const {ANTHROPIC_API_KEY} = config;

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

export class AiController{
  async chatWithAI(req:Request, res:Response){
    try{

    
    const { message, conversationHistory} = req.body;

    if(!message)
      return res.status(400).json({
        success: false,
        message: "Message ee oruuldaggumu naiza?"
    });

    //hereglegchiin todonuudiig awah
    const {Todo} = await import('../models/Todo');
    const userTodos = await Todo.findAll({
      where: {
        userId: req.userId
      },
      order: [["todoDate", "ASC"]],
      limit: 20
    });

    const today = new Date().toISOString().split('T')[0];
    const tommorrow = new Date(Date.now() + 86000000).toISOString().split('T')[0];


    const systemPrompt = `Та хэрэглэгчийн Todo list туслах юм. Та 4 зүйл хийж чадна
      1. "Todo үүсгэх" хэрэглэгч todo нэмхийг хүсвэл JSON утга буцаа:

      {
        "action": "create_todo",
        "todos":[
          {
            "title": "ус уух",
            "todoDate": "2025-10-22"
          }
        ]
      }
      2. "Todo устгах" хэрэглэгч todo устгахийг хүсвэл JSON утга буцаа:

      {
        "action": "delete_todo",
        "todos":[
          {
            "title": "ус уух",
            "todoDate": "2025-10-22"
          }
        ]
      }
      3. "Todo шинэчлэх" хэрэглэгч todo шинэчлэхийг хүсвэл JSON утга буцаа:

      {
        "action": "update_todo",
        "todos":[
          {
            "id": 42,
            "title": "ус уух",
            "todoDate": "2025-10-22",
            "done": false
          } 
        ]
      }
      4. "Хариулт өгөх" хэрэглэгчийн  ердийн асуултанд хариулах:
        {
          "action": "reply",
          "message": "Таны хариулт"
        }
      


      Одоогийн Todo List:

      ${
        userTodos.length >0
          ? userTodos.map(t=>`id: ${t.id}, title: ${t.title}, date: ${t.todoDate}, done: ${t.done}`).join('\n')
          : 'Одоогоор Todo байхгүй байна'
      }


      Өнөөдрийн Огноо: ${today}
      Маргаашийн Огноо: ${tommorrow}

      Огноог ойлгох

      -- Маргааш: ${tommorrow}
      -- 10/23, 10-23 = 2025-10-23
      -- Огноог заавал YYYY-MM-DD форматаар бич
      -- Он заагаагүй бол 2025 гэж ойлго


      Жишээ:
        User: "Маргааш ус уух"
        {action: "create_todo", todos: [{"title": "Ус уух", "todoDate": ${tommorrow}]} }

        User: "Миний todo нүүд юу байна"
        {action: "reply", message: "танд одоогоор ийм todo нүүд байна }

        User: "маргаашийн todo-г устгах"
        {"action": "delete_todo", "todos": [{"title": "Ус уух", "todoDate": "${tommorrow}"}]}
      
      ЗӨВХӨН JSON буцаа, өөр юм битгий бич!`;

      console.log('User message', message);




      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-Cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-accel-buffering', 'no');

      //claude model duudah

      const stream  = await anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          ...conversationHistory || [],
          {
            role: "user",
            content: message,
          },
        ],
      });

      let fullResponse = '';
        for await (const chunk of stream){
          if(chunk.type === 'content_block_delta' && chunk.delta.type=== 'text_delta'){
            const text = chunk.delta.text;
            fullResponse +=text;

            res.write(`data: ${JSON.stringify({
              type: 'text',
              content: text
            })}\n\n`);
          }
        }

        console.log('full Response: ', fullResponse);



      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);

      if(!jsonMatch){
        res.write(`data: ${JSON.stringify({
          type: 'done',
          action: 'reply',
          message: fullResponse
        })}\n\n`);
        return res.end();
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("parsed: ", parsed);
      console.log("parsed actions", parsed.action);

      if(parsed.action === "create_todo" && parsed.todos?.length > 0){

        const createdTodos = await Promise.all(
          parsed.todos.map(async (todo: any)=>{
            const newTodo = await Todo.create({
              title: todo.title,
              todoDate: todo.todoDate,
              done: false,
              userId: req.userId!
            });

            return newTodo.toJSON();
          })
        )

        console.log("created Todo",createdTodos);

        res.write(`data: ${JSON.stringify({
          type: 'done',
          action: 'create_todo',
          todos: createdTodos,
          message: `${createdTodos.length} todo uuslee bro`
        })}\n\n`);
        return res.end();

      }else if(parsed.action === "delete_todo" && parsed.todos?.length > 0){
        console.log("deleting todos: ", parsed.todos);
      
        const deleteResults = await Promise.all(
          parsed.todos.map(async (todo: any) => {
            const foundTodo = await Todo.findOne({
              where: {
                title: todo.title,
                todoDate: todo.todoDate,
                userId: req.userId,
              }
            });
      
            if (foundTodo) {
              const todoId = foundTodo.id;
              await foundTodo.destroy(); 
              return todoId;
            }
      
            return null;
          })
        );
      
        const deletedIds = deleteResults.filter(id => id !== null);
        console.log("deleted ids", deletedIds);

        res.write(`data: ${JSON.stringify({
          type: 'done',
          action: 'delete_todo',
          deletedIds,
          deletedCount: deletedIds.length,
          message: `${deletedIds.length} todo ustlaa` 
        })}\n\n`)
        return res.end();

      }
      else if(parsed.action === 'update_todo' && parsed.todos?.length>0){
        console.log("shinechlegdeh todo: ", parsed.todo);

        const updatedTodos = await Promise.all(
          parsed.todos.map(async (todoData:any)=>{
             const todo = await Todo.findOne({
              where:{
                id: todoData.id,
                userId: req.userId
              }
             })

             if(!todo)
              return res.status(400).json({success: false, message: "todo oldsongui"});

             if(todoData.title !== undefined) 
              todo.title = todoData.title;
            if(todoData.todoDate !== undefined)
              todo.todoDate = todoData.todoDate;
            if(todoData.done !== undefined)
              todo.done = todoData.done;


            await todo.save();
            return todo.toJSON();
          })
        );
        res.write(`data: ${JSON.stringify({
          type: 'done',
          action: 'update_todo',
          updatedTodos,
          message: `${updatedTodos.length} todo shinechlegdelee`
        })}\n\n`)
        return res.end();
      }else{
        res.write(`data: ${JSON.stringify({
          type: 'done',
          action: 'reply',
          message: parsed.message || fullResponse
        })}\n\n`)
        return res.end();
      }
    }catch(error: any){
      res.status(500).json({success: false, message: error. message});
    }
  }
}