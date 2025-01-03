import { useState } from 'react';

function SecretSantaGenerator() {
  const [step, setStep] = useState(1);
  const [eventDetails, setEventDetails] = useState({
    participantCount: '',
    exchangeDate: '',
    budget: ''
  });
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleEventDetailsSubmit = (e) => {
    e.preventDefault();
    if (!eventDetails.participantCount || !eventDetails.exchangeDate || !eventDetails.budget) {
      setError('Please fill in all fields');
      return;
    }
    setParticipants(Array(parseInt(eventDetails.participantCount)).fill().map(() => ({
      name: '',
      email: ''
    })));
    setStep(2);
    setError('');
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    setParticipants(updatedParticipants);
  };

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const generateAssignments = async () => {
    if (participants.some(p => !p.name || !p.email)) {
      setError('Please fill in all participant details');
      return;
    }
    if (participants.some(p => !validateEmail(p.email))) {
      setError('Please enter valid email addresses');
      return;
    }

    setSending(true);
    
    try {
      const shuffled = [...participants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Ensure no one gets themselves
      let attempts = 0;
      const maxAttempts = 100;
      
      while (shuffled.some((person, index) => person === participants[index]) && attempts < maxAttempts) {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        attempts++;
      }

      if (attempts === maxAttempts) {
        throw new Error('Could not generate valid assignments. Please try again.');
      }

      const assignments = participants.map((giver, index) => ({
        giver,
        receiver: shuffled[index]
      }));

      // Send assignments to the deployed backend
      const response = await fetch('https://secret-santa-server-q1si.onrender.com/send-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments,
          eventDetails
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send emails');
      }

      setSending(false);
      setStep(3);
      setError('');

    } catch (error) {
      setError(error.message || 'Failed to send assignments. Please try again.');
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Secret Santa Generator</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEventDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Participants</label>
              <input
                type="number"
                min="3"
                className="w-full p-2 border rounded"
                value={eventDetails.participantCount}
                onChange={(e) => setEventDetails({
                  ...eventDetails,
                  participantCount: e.target.value
                })}
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Budget ($)</label>
              <input
                type="number"
                min="1"
                className="w-full p-2 border rounded"
                value={eventDetails.budget}
                onChange={(e) => setEventDetails({
                  ...eventDetails,
                  budget: e.target.value
                })}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Enter Participant Details</h2>
            {participants.map((participant, index) => (
              <div key={index} className="space-y-2 p-4 border rounded">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={participant.name}
                    onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    value={participant.email}
                    onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={generateAssignments}
              disabled={sending}
              className={`w-full ${sending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white p-2 rounded flex items-center justify-center`}
            >
              {sending ? (
                <>
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

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Success!</h2>
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-lg text-green-800 mb-2">
                All assignments have been sent!
              </p>
              <p className="text-sm text-green-600">
                Check your email for your Secret Santa assignment. 
                Remember to keep it a secret! 🎁
              </p>
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

export default SecretSantaGenerator;