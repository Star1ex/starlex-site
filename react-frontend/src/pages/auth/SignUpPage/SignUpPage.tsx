import React, { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export const API_URL = import.meta.env.VITE_API_URL ?? '';

export const SignUpPage = () => {
  const navigate = useNavigate()
  const [formEmail,setFormEmail] = useState("")
  const [formPassword,setFormPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState('');
  const [formFirstName,setFirstName] = useState("")
  const [formLastName,setLastName] = useState("")

  function handleToSignIn(){
    navigate("/sign-in")
  }
  function handleSetEmail(e: ChangeEvent<HTMLInputElement>){
    setFormEmail(e.target.value)
  }
  function handleSetPassword(e: ChangeEvent<HTMLInputElement>){
    setFormPassword(e.target.value)
  }
  function handleSetFirstName(e: ChangeEvent<HTMLInputElement>){
    setFirstName(e.target.value)
  }
  function handleSetLastName(e: ChangeEvent<HTMLInputElement>){
    setLastName(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent)=>{
        setErrorMessage('')  
        e.preventDefault();

      if (!formEmail || !formPassword || !formFirstName || !formLastName) {
        setErrorMessage('All fields must be filled in');
        return; 
    }

    
    if (!formEmail.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return; 
    }

      const data = {
        email: formEmail,
        password: formPassword,
        first_name: formFirstName,
        last_name: formLastName
      };

      try{
        const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
        if (response.ok){
          
          console.log("Successed login");
          
          //Редирект на dashboard в будущем
        }else{
          if (response.status === 400){
            setErrorMessage("Incorrect email or password")
          }else{
            setErrorMessage("Unknown authorization error")
          }
        }
      }catch (error){
          setErrorMessage('Unable to connect to the server. Check your connection.');
          console.error('Network or server error:', error);
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFD1C1]">
  <div className="flex max-w-5xl w-full  overflow-hidden">

    <div className="w-1/2 p-16 flex flex-col justify-center items-start">
      <h1 className="text-7xl text-[#60392f] font-serif mb-6">Begin</h1>
      <div className="w-1/3 h-0.5 bg-[#d4a89a] mb-6"></div>
      <p className="text-lg text-gray-700">Start something new</p>
    </div>

    <div className="w-1/2 p-16 flex flex-col justify-center ">
      <form className="space-y-7" onSubmit={handleSubmit}>

        <div>
          <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">First Name</label>
          <input
            value={formFirstName}
            onChange={handleSetFirstName}
            type="text"
            placeholder="Dil"
            className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
          <input
            value={formLastName}
            onChange={handleSetLastName}
            type="text"
            placeholder="Doe"
            className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">Email</label>
          <input
            value={formEmail}
            onChange={handleSetEmail}
            type="email"
            placeholder="your@email.com"
            className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">Password</label>
          <input
            value={formPassword}
            onChange={handleSetPassword}
            type="password"
            placeholder="********"
            className="mt-1 w-full border-b bg-[#FFD1C1] border-gray-400 focus:border-[#d4a89a] focus:outline-none py-2 text-gray-800 placeholder-gray-400"
          />
        </div>

          {errorMessage && (
          <p className="text-center text-sm text-red-500 font-medium">
          {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 mt-8 bg-[#d4a89a] text-white font-semibold rounded-md shadow-md hover:bg-[#c69a8c] transition duration-200"
        >
          Sign In
        </button>

        <p className="text-center text-sm text-gray-500 pt-4">
          Have an account? <a href="#" className="text-[#d4a89a] hover:text-[#c69a8c] font-medium" onClick={handleToSignIn}>Sign-In</a>
        </p>

      </form>
    </div>
  </div>

  
</div>
  );
};
