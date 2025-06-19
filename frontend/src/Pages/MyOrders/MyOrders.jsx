import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../Components/context/storeContext';
import './MyOrders.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaSearch, FaCheck, FaPrint, FaQuestionCircle, FaBox, FaShoppingBag, FaMapMarkerAlt, FaRegCreditCard, FaEye, FaTruck, FaWarehouse, FaShippingFast, FaTimes, FaHistory } from 'react-icons/fa';
import { useDispatch, useSelector } from "react-redux";
import { Container, Row, Col, Button, Spinner, Form, Modal, Tab, Nav, Badge } from "react-bootstrap";
import { BsClockHistory, BsCheck2Circle, BsTruck, BsBoxSeam, BsXCircle, BsEnvelope } from "react-icons/bs";
import { MdLocalShipping, MdOutlineDeliveryDining, MdCancel, MdDelete, MdSupport } from 'react-icons/md';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [email, setEmail] = useState(''); // For the form input
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, active, delivered, cancelled

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const orderVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    }
  };

  const statusStepVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } }
  };

  const statusLineVariants = {
    initial: { width: 0 },
    animate: { width: '100%', transition: { duration: 0.5 } }
  };

  // Track loading state for the selected order
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

  useEffect(() => {
    console.log("MyOrders component mounted");
    // Try to get the user email from context or localStorage
    const storedEmail = localStorage.getItem('userEmail');
    
    if (token) {
      console.log("User is logged in with token", token);
      // If user is logged in, try to get their email from localStorage
      if (storedEmail) {
        console.log("Using stored email:", storedEmail);
        setUserEmail(storedEmail);
        fetchUserOrders(storedEmail);
      } else {
        console.log("No stored email found");
        setLoading(false);
      }
    } else if (storedEmail) {
      console.log("User not logged in but email exists in storage:", storedEmail);
      // Not logged in but email exists in storage
      setUserEmail(storedEmail);
      fetchUserOrders(storedEmail);
    } else {
      console.log("No login and no stored email");
      // Not logged in and no email
      setLoading(false);
    }
  }, [token]);

  const fetchUserOrders = async (email) => {
    try {
      console.log("Fetching orders for email:", email);
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:4000/api/orders/user/${email}`);
      console.log("Orders fetched:", response.data);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load your orders. Please try again later.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    console.log("Email submitted:", email);
    setLoadingEmail(true);
    localStorage.setItem('userEmail', email);
    setUserEmail(email);
    fetchUserOrders(email).finally(() => {
      setLoadingEmail(false);
    });
  };

  const viewOrderDetails = (order) => {
    console.log("Viewing order details:", order);
    
    // Attempt to fetch more detailed order information by order ID
    const fetchOrderDetails = async () => {
      try {
        setOrderDetailsLoading(true);
        
        // Try to get detailed order information from different endpoints
        // The first endpoint is by order ID
        let orderData = null;
        try {
          // First try the individual order endpoint
          const response = await axios.get(`http://localhost:4000/api/orders/${order._id}`);
          if (response.data) {
            orderData = response.data;
            console.log("Detailed order fetched by ID:", orderData);
          }
        } catch (err) {
          console.log("Could not fetch by order ID, trying alternative endpoint");
        }
        
        // If that failed, try getting the order tracking information
        if (!orderData && order._id) {
          try {
            const trackingResponse = await axios.get(`http://localhost:4000/api/orders/${order._id}/tracking`);
            if (trackingResponse.data) {
              orderData = { ...order, ...trackingResponse.data };
              console.log("Order tracking information fetched:", orderData);
            }
          } catch (err) {
            console.log("Could not fetch order tracking information");
          }
        }
        
        // If we have detailed data, use it; otherwise use the original order
        if (orderData) {
          setSelectedOrder(orderData);
        } else {
          setSelectedOrder(order);
        }
        
        setOrderDetailsLoading(false);
      } catch (error) {
        console.error("Error fetching detailed order:", error);
        // Fallback to using the order from the list
        setSelectedOrder(order);
        setOrderDetailsLoading(false);
      }
    };
    
    // Try to fetch detailed info if we have an ID
    if (order._id) {
      fetchOrderDetails();
    } else {
      setSelectedOrder(order);
    }
    
    setShowModal(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowModal(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'order_placed': '#3498db',
      'confirmed': '#9b59b6',
      'processing': '#f39c12',
      'dispatched': '#2ecc71',
      'out_for_delivery': '#e67e22',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c'
    };
    return statusColors[status] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFilteredOrders = () => {
    if (!Array.isArray(orders)) {
      console.error("Orders is not an array:", orders);
      return [];
    }
    
    if (activeTab === 'all') return orders;
    if (activeTab === 'active') return orders.filter(order => 
      ['order_placed', 'confirmed', 'processing', 'dispatched', 'out_for_delivery'].includes(order.trackingStatus));
    if (activeTab === 'delivered') return orders.filter(order => order.trackingStatus === 'delivered');
    if (activeTab === 'cancelled') return orders.filter(order => order.trackingStatus === 'cancelled');
    return orders;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'order_placed': return '📋';
      case 'confirmed': return '✓';
      case 'processing': return '⚙️';
      case 'dispatched': return '📦';
      case 'out_for_delivery': return '🚚';
      case 'delivered': return '🏠';
      case 'cancelled': return '❌';
      default: return '•';
    }
  };

  const renderFlipkartStyleTracker = (order) => {
    if (!order || !order.trackingStatus) {
      console.error("Invalid order or missing tracking status", order);
      return null;
    }
    
    // Define all possible statuses in order
    const allStatuses = [
      { id: 'order_placed', label: 'Order Placed', icon: <BsClockHistory /> },
      { id: 'confirmed', label: 'Confirmed', icon: <BsBoxSeam /> },
      { id: 'processing', label: 'Processing', icon: <FaWarehouse /> },
      { id: 'dispatched', label: 'Dispatched', icon: <FaShippingFast /> },
      { id: 'out_for_delivery', label: 'Out for Delivery', icon: <MdOutlineDeliveryDining /> },
      { id: 'delivered', label: 'Delivered', icon: <BsCheck2Circle /> }
    ];
    
    // Find the current status index
    const currentStatusIndex = allStatuses.findIndex(status => status.id === order.trackingStatus);
    
    // Handle cancelled status separately
    if (order.trackingStatus === 'cancelled') {
      return (
        <div className="flipkart-tracker cancelled">
          <motion.div 
            className="status-step cancelled"
            initial="initial"
            animate="animate"
            variants={statusStepVariants}
          >
            <div className="status-icon"><MdCancel /></div>
            <div className="status-label">CANCELLED</div>
            <div className="status-date">{formatDate(order.updatedAt || order.createdAt)}</div>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="flipkart-tracker">
        {allStatuses.map((status, index) => {
          // Determine if this step is completed, active, or upcoming
          const isCompleted = index <= currentStatusIndex;
          const isActive = index === currentStatusIndex;
          
          return (
            <React.Fragment key={status.id}>
              <motion.div 
                className={`status-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                initial="initial"
                animate="animate"
                variants={statusStepVariants}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div 
                  className="status-icon"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {status.icon}
                </motion.div>
                <div className="status-label">{status.label}</div>
                {isCompleted && (
                  <div className="status-date">
                    {status.id === order.trackingStatus 
                      ? formatDate(order.updatedAt || order.createdAt)
                      : ''}
                  </div>
                )}
              </motion.div>
              {index < allStatuses.length - 1 && (
                <motion.div 
                  className={`status-line ${isCompleted && index < currentStatusIndex ? 'completed' : ''}`}
                  initial="initial"
                  animate="animate"
                  variants={statusLineVariants}
                ></motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Debug info - useful for development
  console.log({
    loading,
    userEmail,
    ordersLength: orders?.length || 0,
    error
  });

  // A more comprehensive order details modal with improved error handling
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    // Helper function to handle potentially missing data
    const getValue = (object, path, defaultValue = 'N/A') => {
      if (!object) return defaultValue;
      
      const keys = path.split('.');
      let value = object;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }
      
      return value || defaultValue;
    };

    // Get user details from different possible sources
    const userDetails = {
      firstName: getValue(selectedOrder, 'userDetails.firstName') || 
                 getValue(selectedOrder, 'firstName') || 
                 getValue(selectedOrder, 'user.firstName') || 
                 getValue(selectedOrder, 'name') || '',
      lastName: getValue(selectedOrder, 'userDetails.lastName') || 
                getValue(selectedOrder, 'lastName') || 
                getValue(selectedOrder, 'user.lastName') || '',
      email: getValue(selectedOrder, 'userDetails.email') || 
             getValue(selectedOrder, 'email') || 
             getValue(selectedOrder, 'user.email') || '',
      phone: getValue(selectedOrder, 'userDetails.phone') || 
             getValue(selectedOrder, 'phone') || 
             getValue(selectedOrder, 'user.phone') || '',
    };

    // Get address details from different possible sources
    const addressDetails = {
      street: getValue(selectedOrder, 'shippingAddress.street') || 
              getValue(selectedOrder, 'userDetails.street') || 
              getValue(selectedOrder, 'street') || 
              getValue(selectedOrder, 'user.street') || '',
      city: getValue(selectedOrder, 'shippingAddress.city') || 
            getValue(selectedOrder, 'userDetails.city') || 
            getValue(selectedOrder, 'city') || 
            getValue(selectedOrder, 'user.city') || '',
      state: getValue(selectedOrder, 'shippingAddress.state') || 
             getValue(selectedOrder, 'userDetails.state') || 
             getValue(selectedOrder, 'state') || 
             getValue(selectedOrder, 'user.state') || '',
      pincode: getValue(selectedOrder, 'shippingAddress.pincode') || 
               getValue(selectedOrder, 'userDetails.pincode') || 
               getValue(selectedOrder, 'pincode') || 
               getValue(selectedOrder, 'user.pincode') || '',
    };

    // Get service date if available
    const serviceDate = getValue(selectedOrder, 'serviceDate') || 
                        getValue(selectedOrder, 'userDetails.serviceDate') || 
                        getValue(selectedOrder, 'date') || '';

    // Determine if we have order items from different possible sources
    const orderItems = selectedOrder.orderItems || selectedOrder.products || selectedOrder.services || [];
    
    // Format a date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    };

    // Determine payment method
    const paymentMethod = getValue(selectedOrder, 'paymentMethod') || 
                          getValue(selectedOrder, 'paymentDetails.method') || 
                          'Online Payment';

    // Calculate order total
    const orderTotal = getValue(selectedOrder, 'amount') || 
                       getValue(selectedOrder, 'totalAmount') || 
                       getValue(selectedOrder, 'total') || '0';

    return (
      <Modal show={showModal} onHide={() => setShowModal(false)} className="order-details-modal" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="order-id">
              Order #{getValue(selectedOrder, 'orderId')}
            </div>
            <div className="order-date">
              Placed on {formatDate(getValue(selectedOrder, 'createdAt'))}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderDetailsLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading order details...</p>
            </div>
          ) : (
            <>
              {/* Order Status */}
              {/* <div className="order-status-section mb-4">
                <div className="order-status-header">
                  <h5>Order Status</h5>
                </div>
                <div className="order-status-badge">
                  <Badge bg={
                    selectedOrder.status === 'completed' ? 'success' :
                    selectedOrder.status === 'pending' ? 'warning' :
                    selectedOrder.status === 'processing' ? 'info' :
                    selectedOrder.status === 'cancelled' ? 'danger' : 'secondary'
                  }>
                    {selectedOrder.status?.toUpperCase() || 'PROCESSING'}
                  </Badge>
                </div>
              </div> */}

              {/* Customer Information */}
              <div className="user-info-card mb-4">
                <h5><FaEnvelope className="me-2" /> Customer Information</h5>
                <div className="user-info-content">
                  <div className="user-info-item">
                    <span className="user-info-label">Name:</span>
                    <span className="user-info-value">
                      {userDetails.firstName} {userDetails.lastName}
                    </span>
                  </div>
                  {userDetails.email && (
                    <div className="user-info-item">
                      <span className="user-info-label">Email:</span>
                      <span className="user-info-value">{userDetails.email}</span>
                    </div>
                  )}
                  {userDetails.phone && (
                    <div className="user-info-item">
                      <span className="user-info-label">Phone:</span>
                      <span className="user-info-value">{userDetails.phone}</span>
                    </div>
                  )}
                  {serviceDate && (
                    <div className="user-info-item">
                      <span className="user-info-label">Service Date:</span>
                      <span className="user-info-value">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Tracking */}
              <div className="order-tracking-section mb-4">
                <h5><FaTruck className="me-2" /> Order Tracking</h5>
                <div className="order-tracking-timeline">
                  <Row>
                    <Col xs={3} className={`timeline-item ${selectedOrder.trackingStatus === 'order_placed' || selectedOrder.trackingStatus === 'confirmed' || selectedOrder.trackingStatus === 'processing' || selectedOrder.trackingStatus === 'dispatched' || selectedOrder.trackingStatus === 'out_for_delivery' || selectedOrder.trackingStatus === 'delivered' ? 'active' : ''}`}>
                      <div className="timeline-icon">
                        <FaShoppingBag />
                      </div>
                      <div className="timeline-text">Order Placed</div>
                    </Col>
                    <Col xs={3} className={`timeline-item ${selectedOrder.trackingStatus === 'confirmed' || selectedOrder.trackingStatus === 'processing' || selectedOrder.trackingStatus === 'dispatched' || selectedOrder.trackingStatus === 'out_for_delivery' || selectedOrder.trackingStatus === 'delivered' ? 'active' : ''}`}>
                      <div className="timeline-icon">
                        <FaWarehouse />
                      </div>
                      <div className="timeline-text">Processing</div>
                    </Col>
                    <Col xs={3} className={`timeline-item ${selectedOrder.trackingStatus === 'dispatched' || selectedOrder.trackingStatus === 'out_for_delivery' || selectedOrder.trackingStatus === 'delivered' ? 'active' : ''}`}>
                      <div className="timeline-icon">
                        <FaShippingFast />
                      </div>
                      <div className="timeline-text">Shipped</div>
                    </Col>
                    <Col xs={3} className={`timeline-item ${selectedOrder.trackingStatus === 'out_for_delivery' || selectedOrder.trackingStatus === 'delivered' ? 'active' : ''}`}>
                      <div className="timeline-icon">
                        <FaCheck />
                      </div>
                      <div className="timeline-text">Delivered</div>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Tracking History */}
              {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                <div className="tracking-history-section mb-4">
                  <h5><FaHistory className="me-2" /> Tracking History</h5>
                  <div className="tracking-history-list">
                    {selectedOrder.trackingHistory.map((item, index) => (
                      <div key={index} className="tracking-history-item">
                        <div className="tracking-history-date">{formatDate(item.timestamp)}</div>
                        <div className="tracking-history-status">{item.status}</div>
                        {item.note && <div className="tracking-history-note">{item.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="payment-info-section mb-4">
                <h5><FaRegCreditCard className="me-2" /> Payment Information</h5>
                <div className="payment-details-card">
                  <div className="payment-rows">
                    <div className="payment-row">
                      <div className="payment-label">
                        <FaRegCreditCard className="payment-icon" />
                        <span>Payment Method</span>
                      </div>
                      {/* <div className="payment-value">{paymentMethod}</div> */}
                      <div className="payment-value">Razorpay</div>
                    </div>
                    
                    {selectedOrder.paymentId && (
                      <div className="payment-row">
                        <div className="payment-label">
                          <FaHistory className="payment-icon" />
                          <span>Payment ID</span>
                        </div>
                        <div className="payment-value payment-id-value">{selectedOrder.paymentId}</div>
                      </div>
                    )}
                    
                    <div className="payment-row">
                      <div className="payment-label">
                        <FaCheck className="payment-icon" />
                        <span>Payment Status</span>
                      </div>
                      <div className="payment-value">
                        <Badge bg="success" className="payment-status-badge">
                          PAID
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedOrder.paymentDate && (
                      <div className="payment-row">
                        <div className="payment-label">
                          <BsClockHistory className="payment-icon" />
                          <span>Payment Date</span>
                        </div>
                        <div className="payment-value">{formatDate(selectedOrder.paymentDate)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-summary-section">
                <h5><FaShoppingBag className="me-2" /> Order Summary</h5>
                <div className="order-summary-card">
                  <div className="summary-rows">
                    <div className="summary-row">
                      <span className="summary-label">Subtotal</span>
                      <span className="summary-value">₹{orderTotal}</span>
                    </div>
                    
                    <div className="summary-row">
                      <span className="summary-label">Shipping</span>
                      <span className="summary-value">₹{getValue(selectedOrder, 'shippingCost', '0')}</span>
                    </div>
                    
                    {getValue(selectedOrder, 'tax', '0') !== '0' && (
                      <div className="summary-row">
                        <span className="summary-label">Tax</span>
                        <span className="summary-value">₹{getValue(selectedOrder, 'tax', '0')}</span>
                      </div>
                    )}
                    
                    {getValue(selectedOrder, 'discount', '0') !== '0' && (
                      <div className="summary-row discount-row">
                        <span className="summary-label">Discount</span>
                        <span className="summary-value discount-value">-₹{getValue(selectedOrder, 'discount', '0')}</span>
                      </div>
                    )}
                    
                    <div className="summary-row total-row">
                      <span className="summary-label">Total</span>
                      <span className="summary-value total-value">₹{orderTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {!orderDetailsLoading && (
            <Button variant="primary" onClick={printOrderDetails}>
              <FaPrint className="me-2" /> Print Order
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  };

  // Print order details function
  const printOrderDetails = () => {
    console.log("Printing order details");
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Define the print content with proper styling
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${selectedOrder?.orderId || 'N/A'} - Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6c63ff;
            margin-bottom: 10px;
          }
          .order-id {
            font-size: 16px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #444;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            width: 150px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #eee;
          }
          .item-row:last-child {
            border-bottom: none;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #eee;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="logo">Homease</div>
          <div class="order-id">Order #${selectedOrder?.orderId || 'N/A'}</div>
          <div>Order Date: ${formatDate(selectedOrder?.createdAt || new Date())}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-row">
            <div class="info-label">Name:</div>
            <div>${(selectedOrder?.userDetails?.firstName || '') + ' ' + (selectedOrder?.userDetails?.lastName || '')}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div>${selectedOrder?.userDetails?.email || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Phone:</div>
            <div>${selectedOrder?.userDetails?.phone || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Order Status</div>
          <div>${selectedOrder?.trackingStatus?.replace(/_/g, ' ').toUpperCase() || 'PROCESSING'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Order Summary</div>
          <div class="info-row">
            <div class="info-label">Subtotal:</div>
            <div>₹${selectedOrder?.amount || '0'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Shipping:</div>
            <div>₹${selectedOrder?.shippingCost || '0'}</div>
          </div>
          <div class="total-row">
            <div>Total:</div>
            <div>₹${selectedOrder?.amount || '0'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="info-row">
            <div class="info-label">Payment Method:</div>
            <div>${selectedOrder?.paymentMethod || 'Online Payment'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Payment Status:</div>
            <div>${selectedOrder?.paymentStatus?.toUpperCase() || 'PENDING'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Payment ID:</div>
            <div>${selectedOrder?.paymentId || 'N/A'}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>For any questions, please contact our customer support at support@homease.com</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    
    // Write the content to the new window and print
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Show loading indicator
  if (loading) {
    return (
      <Container className="py-5">
        <motion.div 
          className="loading-spinner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-3 text-muted"
          >
            Loading your orders...
          </motion.p>
        </motion.div>
      </Container>
    );
  }

  // Debug order data - remove in production
  console.log("Orders Data:", orders);

  return (
    <div>
      <Container className="my-5">
        {/* Email form for non-logged in users */}
        {!userEmail && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="email-form"
          >
            <h3 className="mb-4">Enter your email to view your orders</h3>
            <Form onSubmit={handleEmailSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter the email you used for your order"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" className="submit-btn" disabled={loadingEmail}>
                {loadingEmail ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Loading...
                  </>
                ) : (
                  <>Find My Orders <FaSearch className="ms-2" /></>
                )}
              </Button>
            </Form>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div 
            className="alert alert-danger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.div>
        )}

        {/* Orders list */}
        {userEmail && orders && orders.length > 0 && !loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="orders-list"
          >
            <motion.h3 
              className="mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Your Orders
            </motion.h3>
            
            {getFilteredOrders().map((order) => (
              <motion.div 
                key={order._id || Math.random().toString()}
                className="orders-container"
                variants={orderVariants}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="order-header">
                  <Row>
                    <Col>
                      <div className="order-id">Order #{order._id?.substring(0, 8) || 'N/A'}</div>
                      <div className="order-date">Placed on {formatDate(order.createdAt)}</div>
                    </Col>
                    <Col xs="auto">
                      <div className={`order-status status-${order.trackingStatus?.toLowerCase() || 'processing'}`}>
                        {order.trackingStatus?.replace(/_/g, ' ').toUpperCase() || 'PROCESSING'}
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className="order-body">
                  {renderFlipkartStyleTracker(order)}
                  <Row className="mt-4">
                    <Col md={6}>
                      {order.shippingAddress && (
                        <div>
                          <strong>Shipping Address:</strong>
                          <p className="mb-0">{order.shippingAddress.name}</p>
                          <p className="mb-0">{order.shippingAddress.address}</p>
                          <p className="mb-0">
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                          <p className="mb-0">{order.shippingAddress.country}</p>
                        </div>
                      )}
                    </Col>
                    <Col md={6} className="d-flex justify-content-md-end align-items-end mt-3 mt-md-0">
                      <motion.button
                        onClick={() => viewOrderDetails(order)}
                        className="view-details-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaEye className="me-2" /> View Order Details
                      </motion.button>
                    </Col>
                  </Row>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No orders message */}
        {userEmail && (!orders || orders.length === 0) && !loading && <NoOrders />}

        {/* Order details modal */}
        <OrderDetailsModal 
          show={showModal} 
          handleClose={closeOrderDetails} 
          selectedOrder={selectedOrder} 
        />
      </Container>
    </div>
  );
};

const NoOrders = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      className="py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Container>
        <motion.div 
          className="no-orders"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.2
          }}
        >
          <div className="no-orders-content">
            <motion.div 
              className="no-orders-icon-container"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <div className="icon-circle">
                <FaShoppingBag className="no-orders-icon" />
              </div>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              No Orders Found
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              You haven't placed any orders yet. Browse our services and place your first order!
            </motion.p>
            
            <motion.div
              className="no-orders-buttons"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Button 
                variant="primary" 
                className="shop-now-btn"
                onClick={() => navigate('/')}
                as={motion.button}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 20px rgba(108, 99, 255, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="d-flex align-items-center"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Shop Now <FaShoppingBag className="ms-2" />
                </motion.span>
              </Button>
              
              <Button
                variant="outline-secondary"
                className="browse-services-btn mt-3"
                onClick={() => navigate('/services')}
                as={motion.button}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(108, 99, 255, 0.05)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  className="d-flex align-items-center"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  Browse Services <FaTruck className="ms-2" />
                </motion.span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default MyOrders; 