import React, { useContext, useState, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../Components/context/storeContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const { cartItems, getTotalCartAmount, clearCart, token } = useContext(StoreContext);
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: localStorage.getItem('userEmail') || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    serviceDate: "", // Added service date field
  });

  const navigate = useNavigate();

  const totalAmount =
    getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 200;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    const services = Object.keys(cartItems).map((key, value) => ({
      name: key,
      quantity: cartItems[key],
    }));

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/orders/create-order",
        {
          amount: totalAmount,
        }
      );

      const options = {
        key: "rzp_test_ckOaggIIemTmet",
        amount: data.amount,
        currency: "INR",
        name: "Homease Services",
        description: "Service Payment",
        order_id: data.id,
        handler: async function (response) {
          alert(
            "Payment Successful! Payment ID: " + response.razorpay_payment_id
          );

          // Store the order in DB after payment success
          const verifyResponse = await axios.post(
            "http://localhost:4000/api/orders/verify-payment",
            {
              orderId: data.id,
              paymentId: response.razorpay_payment_id,
              userDetails: userDetails,
              services: services,
              amount: totalAmount,
            }
          );

          // Store the user's email in localStorage for order tracking
          localStorage.setItem('userEmail', userDetails.email);

          // Display OTP for admin (for testing purposes)
          console.log("OTP for admin:", verifyResponse.data.otp);

          alert("An OTP has been sent to your email for verification.");

          clearCart();
          navigate("/", {
            state: { message: "Your service has been booked successfully!" },
          });
        },
        prefill: {
          name: userDetails.firstName + " " + userDetails.lastName,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        theme: { color: "#FF5733" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Error in payment:", error);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for comparison

    if (selectedDate < today) {
      alert(
        "You cannot select a date from the past. Please choose a valid date."
      );
      e.target.value = ""; // Clear the invalid date
    } else {
      handleInputChange(e);
    }
  };

  return (
    <form className="place-order" onSubmit={handlePayment}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-field">
          <input 
            type="text" 
            name="firstName"
            value={userDetails.firstName}
            onChange={handleInputChange}
            placeholder="First Name" 
            required 
          />
          <input 
            type="text" 
            name="lastName"
            value={userDetails.lastName}
            onChange={handleInputChange}
            placeholder="Last Name" 
            required 
          />
        </div>
        <input 
          type="email" 
          name="email"
          value={userDetails.email}
          onChange={handleInputChange}
          placeholder="Email address" 
          required 
        />
        <input 
          type="text" 
          name="street"
          value={userDetails.street}
          onChange={handleInputChange}
          placeholder="Street" 
          required 
        />
        <div className="multi-field">
          <input 
            type="text" 
            name="city"
            value={userDetails.city}
            onChange={handleInputChange}
            placeholder="City" 
            required 
          />
          <input 
            type="text" 
            name="district"
            value={userDetails.district}
            onChange={handleInputChange}
            placeholder="District" 
            required 
          />
        </div>
        <div className="multi-field">
          <input 
            type="text" 
            name="state"
            value={userDetails.state}
            onChange={handleInputChange}
            placeholder="State" 
            required 
          />
          <input 
            type="text" 
            name="pincode"
            value={userDetails.pincode}
            onChange={handleInputChange}
            placeholder="Pincode" 
            required 
          />
        </div>
        <input 
          type="text" 
          name="phone"
          value={userDetails.phone}
          onChange={handleInputChange}
          placeholder="Phone" 
          required 
        />

        {/* New Date Field */}
        <label>Select Service Date:</label>
        <input 
          type="date" 
          name="serviceDate"
          value={userDetails.serviceDate}
          onChange={handleDateChange}
          required 
        />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>Rs. {getTotalCartAmount()}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <p>Service charges</p>
            <p>Rs. {getTotalCartAmount() === 0 ? 0 : 200}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <b>Total</b>
            <b> Rs. {totalAmount}</b>
          </div>
          <button type="submit">PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
