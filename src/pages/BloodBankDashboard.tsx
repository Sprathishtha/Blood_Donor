import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { RequestRouteMap } from "../components/RequestRouteMap";
import { parsePostGISPoint } from "../utils/geospatial";
import { Link } from "react-router-dom";

interface RequestItem {
  notification_id: number;
  request_id: string;
  blood_group: string;
  urgency_level: string;
  quantity: number;
  status: string;
  created_at: string;
  hospital_name: string;
  hospital_location: any;
}

export function BloodBankDashboard() {

  const [requests,setRequests] = useState<RequestItem[]>([])
  const [loading,setLoading] = useState(true)

  const [availableUnits,setAvailableUnits] = useState(1)
  const [message,setMessage] = useState("")

  const [bloodbankLocation,setBloodbankLocation] = useState<any>(null)

  useEffect(()=>{
    loadRequests()
    loadBloodbankLocation()
  },[])

  // ------------------------
  // Load Blood Bank Location
  // ------------------------

  const loadBloodbankLocation = async()=>{

    const { data:auth } = await supabase.auth.getUser()
    const authId = auth.user?.id

    if(!authId) return

    const { data } = await supabase
      .from("blood_banks")
      .select("location")
      .eq("auth_user_id",authId)
      .maybeSingle()

    if(data?.location){
      setBloodbankLocation(parsePostGISPoint(data.location))
    }

  }

  // ------------------------
  // Load TODAY requests only
  // ------------------------

  const loadRequests = async()=>{

    setLoading(true)

    const { data:auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if(!authId) return

    const today = new Date()
    today.setHours(0,0,0,0)

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        status,
        created_at,
        request_id,
        blood_requests!notifications_request_id_fkey (
          id,
          blood_group,
          urgency_level,
          quantity,
          status,
          created_at,
          hospitals!blood_requests_hospital_id_fkey (
            name,
            location
          )
        )
      `)
      .eq('user_id', authId)
      .eq('role', 'blood_bank')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    const formatted:RequestItem[] = (data || []).map((n:any)=>({

      notification_id:n.id,
      request_id:n.request_id,

      blood_group:n.blood_requests?.blood_group,
      urgency_level:n.blood_requests?.urgency_level,
      quantity:n.blood_requests?.quantity,
      created_at:n.blood_requests?.created_at,

      hospital_name:n.blood_requests?.hospitals?.name,
      hospital_location:n.blood_requests?.hospitals?.location,

      status:n.blood_requests?.status

    }))

    setRequests(formatted)
    setLoading(false)

  }

  // ------------------------
  // Accept Request
  // ------------------------

  const handleAccept = async (r: RequestItem) => {

    const { data: auth } = await supabase.auth.getUser()
    const authId = auth.user?.id
    if (!authId) return

    const { data: bank } = await supabase
      .from("blood_banks")
      .select("id")
      .eq("auth_user_id", authId)
      .single()

    if (!bank) return

    await supabase
      .from("blood_requests")
      .update({
        status: "matched",
        matched_bloodbank_id: bank.id,
        bloodbank_units: availableUnits,
        units_fulfilled: availableUnits,
        response_message: message
      })
      .eq("id", r.request_id)

    await supabase
      .from("notifications")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString()
      })
      .eq("id", r.notification_id)

    await supabase
      .from("notifications")
      .update({ status: "expired" })
      .eq("request_id", r.request_id)
      .neq("id", r.notification_id)

    setMessage("")
    setAvailableUnits(1)

    loadRequests()

  }

  // ------------------------
  // Decline Request
  // ------------------------

  const handleDecline = async(id:number)=>{

    try{

      const { error } = await supabase
        .from("notifications")
        .update({ status:"declined" })
        .eq("id",id)

      if(error){
        console.error(error)
        return
      }

      loadRequests()

    }catch(err){
      console.error(err)
    }

  }

  const count = (status:string)=>
    requests.filter(r=>r.status===status).length

  return(

    <AppLayout>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-6">

          <h1 className="text-3xl font-bold">
            Blood Bank Dashboard
          </h1>

          <Link
            to="/bloodbank/history"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            History
          </Link>

        </div>

        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <StatCard label="Received" value={requests.length} color="yellow"/>

          <StatCard label="Pending" value={count("pending")} color="blue"/>

          <StatCard label="Accepted" value={count("matched")} color="green"/>

        </div>

        {/* LIST */}

        {loading ? (

          <div className="bg-white p-6 text-center">
            Loading...
          </div>

        ) : requests.length===0 ? (

          <div className="bg-white p-6 text-center text-gray-500">
            No requests today
          </div>

        ) : (

          <div className="space-y-4">

            {requests.map(r=>{

              const hospitalCoords = r.hospital_location
                ? parsePostGISPoint(r.hospital_location)
                : null

              return(

                <div
                  key={r.notification_id}
                  className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500"
                >

                  <div className="flex justify-between mb-3">

                    <div>

                      <span className="text-xl font-bold text-red-600">
                        {r.blood_group}
                      </span>

                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(r.created_at),{addSuffix:true})}
                      </p>

                    </div>

                    <span className="capitalize text-sm">
                      {r.status}
                    </span>

                  </div>

                  <div className="text-sm mb-3">

                    <p>
                      <strong>Hospital:</strong> {r.hospital_name}
                    </p>

                    <p>
                      <strong>Units Needed:</strong> {r.quantity}
                    </p>

                  </div>

                  {r.status==="pending" && (

                    <div className="space-y-3">

                      <div className="flex gap-3 items-center">

                        <input
                          type="number"
                          value={availableUnits}
                          min="1"
                          onChange={(e)=>setAvailableUnits(Number(e.target.value))}
                          className="border px-3 py-2 rounded w-24"
                        />

                        <span className="text-sm text-gray-500">
                          units available
                        </span>

                      </div>

                      <textarea
                        placeholder="Message to hospital..."
                        value={message}
                        onChange={(e)=>setMessage(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                      />

                      <div className="flex gap-3">

                        <button
                          onClick={()=>handleAccept(r)}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Accept
                        </button>

                        <button
                          onClick={()=>handleDecline(r.notification_id)}
                          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                        >
                          Decline
                        </button>

                      </div>

                    </div>

                  )}

                  {r.status==="matched" && hospitalCoords && bloodbankLocation && (

                    <div className="mt-4 border-t pt-4">

                      <RequestRouteMap
                        hospitalLocation={hospitalCoords}
                        donorLocation={bloodbankLocation}
                      />

                    </div>

                  )}

                </div>

              )

            })}

          </div>

        )}

      </div>

    </AppLayout>

  )

}

function StatCard({label,value,color}:{label:string,value:number,color:string}){

  const border =
    color==="yellow" ? "border-yellow-500"
    : color==="blue" ? "border-blue-500"
    : "border-green-500"

  return(

    <div className={`bg-white p-6 rounded shadow border-l-4 ${border}`}>

      <p className="text-sm text-gray-600">
        {label}
      </p>

      <p className="text-3xl font-bold">
        {value}
      </p>

    </div>

  )

}