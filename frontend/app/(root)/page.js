"use client";
import axios from "axios";
import { useRouter } from 'next/navigation';

export default function Home() {
  //router.route("/logout").post(verifyJwt, logOutUser);
  const router = useRouter()
  const handleLogout = async () => {
    console.log("handleLogout")
   const response = await axios.post("/api/v1/users/logout",{},{
      headers: {
        "Content-Type": "application/json", // Change to JSON
      },
      withCredentials: true,
    });
    console.log(response)
    if(response.data.message){
      router.push('/sign-in')
    }
  };
  return (
    <div className="center">
      <h1 className="h1">Video Tube</h1>
      <button className="cursor-pointer" onClick={handleLogout}>Logout</button>
    </div>
  );
}
