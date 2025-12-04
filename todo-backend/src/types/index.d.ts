export interface CreateTodoDTO{
    title: string;
    done?: boolean;
    todoDate?: string;
}

export interface UpdateTodoDTO{
    title?: string;
    done?:boolean;
}


export interface SignUpDTO{
    email: string,
    password: string
}

export interface LoginUpDTO{
    email: string,
    password: string
}