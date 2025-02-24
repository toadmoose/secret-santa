// Import the useState hook from React, which allows us to add state to our component
// State is like memory that lets the component remember and update information
import { useState } from 'react';

// Define the main component for our Secret Santa application
function SecretSantaGenerator() {
  // Create state variables using useState
  // Each state variable comes with a function to update it (set...)
  
  // step: Tracks which screen the user is currently viewing (1, 2, or 3)
  const [step, setStep] = useState(1);
  
  // eventDetails: Stores information about the Secret Santa event
  const [eventDetails, setEventDetails] = useState({
    participantCount: '',  // How many people are participating
    exchangeDate: '',      // When the gift exchange will happen
    budget: ''             // How much money to spend on gifts
  });
  
  // participants: An array that will hold information about each person
  const [participants, setParticipants] = useState([]);
  
  // error: Stores error messages to display to the user
  const [error, setError] = useState('');
  
  // sending: Tracks whether emails are currently being sent
  const [sending, setSending] = useState(false);

  // This function runs when the user submits the first form (event details)
  const handleEventDetailsSubmit = (e) => {
    // Prevent the form from refreshing the page
    e.preventDefault();
    
    // Check if all fields are filled out
    if (!eventDetails.participantCount || !eventDetails.exchangeDate || !eventDetails.budget) {
      // If not, show an error message
      setError('Please fill in all fields');
      return;
    }
    
    // Create an array with empty participant objects based on the number entered
    // This creates placeholders for each participant's information
    setParticipants(Array(parseInt(eventDetails.participantCount)).fill().map(() => ({
      name: '',
      email: ''
    })));
    
    // Move to step 2 (participant details screen)
    setStep(2);
    
    // Clear any previous error messages
    setError('');
  };

  // This function updates a specific participant's information when they type in fields
  const handleParticipantChange = (index, field, value) => {
    // Create a copy of the participants array to avoid directly modifying state
    const updatedParticipants = [...participants];
    
    // Update the specific field (name or email) for the participant at the given index
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    
    // Save the updated array back to state
    setParticipants(updatedParticipants);
  };

  // This function checks if an email address looks valid
  const validateEmail = (email) => {
    // Use a regular expression pattern to check email format
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  // This function creates the Secret Santa assignments and sends emails
  const generateAssignments = async () => {
    // Check if all participants have both name and email filled out
    if (participants.some(p => !p.name || !p.email)) {
      setError('Please fill in all participant details');
      return;
    }
    
    // Check if all email addresses are valid
    if (participants.some(p => !validateEmail(p.email))) {
      setError('Please enter valid email addresses');
      return;
    }

    // Show the loading state while processing
    setSending(true);
    
    try {
      // Create a copy of the participants array to shuffle
      const shuffled = [...participants];
      
      // Shuffle the array using the Fisher-Yates algorithm
      // This randomly rearranges all the participants
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Make sure no one is assigned to themselves as a Secret Santa
      let attempts = 0;
      const maxAttempts = 100;
      
      // Keep reshuffling until no one is assigned to themselves
      // or until we reach the maximum number of attempts
      while (shuffled.some((person, index) => person === participants[index]) && attempts < maxAttempts) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        attempts++;
      }

      // If we couldn't find a valid arrangement after many attempts, show an error
      if (attempts === maxAttempts) {
        throw new Error('Could not generate valid assignments. Please try again.');
      }

      // Create the final assignments, where each person gives a gift to the next person in the shuffled list
      const assignments = participants.map((giver, index) => ({
        giver,    // The person giving the gift
        receiver: shuffled[index]  // The person receiving the gift
      }));

      // Send the assignments to the server to email everyone
      const response = await fetch('https://secret-santa-server-q1si.onrender.com/send-assignments', {
        method: 'POST',  // Using HTTP POST method to send data
        headers: {
          'Content-Type': 'application/json',  // Tell the server we're sending JSON
        },
        body: JSON.stringify({  // Convert our data to a JSON string
          assignments,
          eventDetails
        })
      });

      // Parse the server's response from JSON
      const data = await response.json();
      
      // If the server indicates failure, show an error
      if (!data.success) {
        throw new Error(data.message || 'Failed to send emails');
      }

      // If everything worked, hide the loading indicator
      setSending(false);
      
      // Move to step 3 (success screen)
      setStep(3);
      
      // Clear any error messages
      setError('');

    } catch (error) {
      // If anything went wrong, show the error message
      setError(error.message || 'Failed to send assignments. Please try again.');
      
      // Hide the loading indicator
      setSending(false);
    }
  };

  // The visual part of our component - what appears on the screen
  return (
    // Main container with maximum width and centered on page
    <div className="max-w-2xl mx-auto p-4">
      {/* White card with shadow and rounded corners */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Title of our application */}
        <h1 className="text-3xl font-bold text-center mb-6">Secret Santa Generator</h1>
        
        {/* Show error message if there is one */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* STEP 1: Event Details Form */}
        {step === 1 && (
          <form onSubmit={handleEventDetailsSubmit} className="space-y-4">
            {/* Number of participants input */}
            <div>
              <label className="block text-sm font-medium mb-1">Number of Participants</label>
              <input
                type="number"
                min="3"  // Minimum 3 participants needed
                className="w-full p-2 border rounded"
                value={eventDetails.participantCount}
                onChange={(e) => setEventDetails({
                  ...eventDetails,
                  participantCount: e.target.value
                })}
              />
            </div>
            {/* Date of gift exchange input */}
            <div>
              <label className="block text-sm font-medium mb-1">Exchange Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={eventDetails.exchangeDate}
                onChange={(e) => setEventDetails({
                  ...eventDetails,
                  exchangeDate: e.target.value
                })}
              />
            </div>
            {/* Budget input */}
            <div>
              <label className="block text-sm font-medium mb-1">Budget ($)</label>
              <input
                type="number"
                min="1"  // At least $1 budget
                className="w-full p-2 border rounded"
                value={eventDetails.budget}
                onChange={(e) => setEventDetails({
                  ...eventDetails,
                  budget: e.target.value
                })}
              />
            </div>
            {/* Button to submit the form */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          </form>
        )}

        {/* STEP 2: Participant Details Form */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Enter Participant Details</h2>
            {/* Create a form section for each participant */}
            {participants.map((participant, index) => (
              <div key={index} className="space-y-2 p-4 border rounded">
                {/* Name input for this participant */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={participant.name}
                    onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                  />
                </div>
                {/* Email input for this participant */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={participant.email}
                    onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                  />
                  {/* Warning about email deliverability */}
                  <p className="text-sm text-gray-500 mt-1">
                    ⚠️ Some email providers (especially .edu addresses) may block these emails. Please use a personal email address that can receive automated messages.
                  </p>
                </div>
              </div>
            ))}
            {/* Button to generate assignments and send emails */}
            <button
              onClick={generateAssignments}
              disabled={sending}  // Disable the button while sending
              className={`w-full ${sending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white p-2 rounded flex items-center justify-center`}
            >
              {sending ? (
                <>
                  {/* Spinning loading indicator */}
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Assignments...
                </>
              ) : 'Generate & Send Assignments'}
            </button>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Success!</h2>
            {/* Green success message box */}
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-lg text-green-800 mb-2">
                All assignments have been sent!
              </p>
              <p className="text-sm text-green-600">
                Check your email for your Secret Santa assignment. 
                Remember to keep it a secret! 🎁
              </p>
              {/* Display the budget and exchange date */}
              <p className="text-sm text-gray-600 mt-4">
                Budget: ${eventDetails.budget}
                <br />
                Exchange Date: {new Date(eventDetails.exchangeDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the component so it can be used in other parts of the application
export default SecretSantaGenerator;
