import { Response } from "express"



type TMeta = {
  page:number
  limit:number
  total: number
  totalPage: number
}

type TResponse<T> ={
  success :boolean
  statusCode: number
  message : T
  meta?: TMeta
}


export const SendResponse  = <T>(res:Response,data:TResponse<T>)=>{
    res.status(data.statusCode).json({
        success:data.success,
        statusCode: data.statusCode,
        message:data.message,
        data:data.message,
        meta: data.meta
    })
}