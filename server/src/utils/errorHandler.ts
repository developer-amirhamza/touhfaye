

export const errorHandler = (res:any,statusCode:number,message:string,error=true, data:any=null)=>{
    res.status(statusCode).json({
        success:!error,
        error,
        message,
        ...(data ? {data} : {})
    });
};