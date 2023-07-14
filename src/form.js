import React, { useState } from 'react';
import axios from 'axios';
import Graph from './graph'; 

const VendorForm = () => {
  const [name, setName] = useState('');
  const [countData, setCountData] = useState({});  // for countDictionary
  const [monthData, setMonthData] = useState({});  // for monthDictionary

  const handleInputChange = (event) => {
    setName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Send a POST request to the Express.js backend
    axios.post('http://localhost:5001/api/vendor', { name })
      .then((response) => {

        setCountData(response.data.countDictionary);
        setMonthData(response.data.monthDictionary);

        console.log(response.data);

        //both dictionaries are OK.

      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Vendor Name:
          <input type="text" value={name} onChange={handleInputChange} />
        </label>
        <button type="submit">Submit</button>
      </form>
      
      <Graph data={countData} />

      <Graph data={monthData} />

    </div>
  );
};

export default VendorForm;