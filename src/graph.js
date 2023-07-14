import React from 'react';
import { Bar } from 'react-chartjs-2';

const Graph = ({data}) => {
  const labels = Object.keys(data);
  const dataValues = Object.values(data);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Data',
        data: dataValues,
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(75,192,192,0.4)',
        hoverBorderColor: 'rgba(75,192,192,1)'
      }
    ]
  };

  return (
    <Bar data={chartData} />
  );
}

export default Graph;
