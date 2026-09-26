import type{ Response } from "express"



type TMeta = {
  page:number
  limit:number
  total: number
  totalPage: number
}

type TResponse<T> ={
  success :boolean
  statusCode: number
  message : string
  data: T
  meta?: TMeta
}


export const SendResponse  = <T>(res:Response,data:TResponse<T>)=>{
    res.status(data.statusCode).json({
        success:data.success,
        statusCode: data.statusCode,
        message:data.message,
        data:data.data,
        meta: data.meta
    })
}