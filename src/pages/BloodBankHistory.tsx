import { useEffect, useState } from "react"
import { AppLayout } from "../components/AppLayout"
import { supabase } from "../lib/supabase"
import { formatDistanceToNow } from "date-fns"

interface HistoryItem{
  id:number
  blood_group:string
  hospital_name:string
  status:string
  created_at:string
}

export function BloodBankHistory(){

  const [history,setHistory] = useState<HistoryItem[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    loadHistory()
  },[])

  const loadHistory = async()=>{

    const { data:auth } = await supabase.auth.getUser()
    const authId = auth.user?.id

    if(!authId) return

    const today = new Date()
    today.setHours(0,0,0,0)

    const { data,error } = await supabase
      .from("notifications")
      .select(`
        id,
        status,
        created_at,
        blood_requests!notifications_request_id_fkey (
          blood_group,
          hospitals!blood_requests_hospital_id_fkey (
            name
          )
        )
      `)
      .eq("user_id",authId)
      .eq("role","blood_bank")
      .lt("created_at",today.toISOString())   // 👈 past records
      .order("created_at",{ascending:false})

    if(error){
      console.error(error)
      return
    }

    const formatted = (data||[]).map((n:any)=>({

      id:n.id,
      blood_group:n.blood_requests?.blood_group,
      hospital_name:n.blood_requests?.hospitals?.name,
      status:n.status,
      created_at:n.created_at

    }))

    setHistory(formatted)
    setLoading(false)

  }

  return(

    <AppLayout>

      <div className="max-w-5xl mx-auto px-4 py-8">

        <h1 className="text-3xl font-bold mb-6">
          Blood Bank History
        </h1>

        {loading ?(

          <p>Loading...</p>

        ): history.length===0 ?(

          <p className="text-gray-500">
            No past records
          </p>

        ):(

          <div className="space-y-4">

            {history.map(h=>(

              <div
                key={h.id}
                className="bg-white p-5 rounded shadow border-l-4 border-gray-400"
              >

                <div className="flex justify-between">

                  <span className="text-lg font-bold text-red-600">
                    {h.blood_group}
                  </span>

                  <span className="capitalize">
                    {h.status}
                  </span>

                </div>

                <p className="text-sm text-gray-500">
                  {h.hospital_name}
                </p>

                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(h.created_at),{addSuffix:true})}
                </p>

              </div>

            ))}

          </div>

        )}

      </div>

    </AppLayout>

  )

}