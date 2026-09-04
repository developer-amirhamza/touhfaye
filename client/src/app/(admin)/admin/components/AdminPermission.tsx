import React from 'react'

import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import IsAdmin from '@/utils/IsAdmin'

interface type {
    children:any
}


const AdminPermission:React.FC<type> = ({children}) => {
const {user} = useSelector((state:RootState)=>state.userSlice);
  const userRole = user?.role
  console.log(userRole)
  return (
    <>
    {IsAdmin(userRole) && children }
    </>
  )
}

export default AdminPermission