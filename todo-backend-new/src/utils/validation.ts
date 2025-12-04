export const validateTodoInput=(input:any)=>{
    if(!input.title || input.title.trim() === ""){
        throw new Error("title bhguenshd");
    }
}