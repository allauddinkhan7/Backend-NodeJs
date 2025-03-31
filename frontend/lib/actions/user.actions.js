"use client";
import axios from "axios";

export const createAccount = async ({formDataToSend}) => {
    const response = await axios.post('/api/v1/users/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true // if using cookies
    });

    console.log('Received response:', response.data);
    alert( response.data.message)
   
}

export const signInUser = async (loginData) => {  // Remove destructuring
  try {
    const response = await axios.post('/api/v1/users/login', loginData, {
      headers: {
        'Content-Type': 'application/json',  // Change to JSON
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
   return error
  }
};

// @/lib/actions/user.actions.js
export const currentUser = async () => {
  try {
    const response = await fetch('/api/v1/users/current-user', {
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};