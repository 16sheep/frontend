import React from 'react';
import PropTypes from 'prop-types';
import TripsScene from './../../../styled_scenes/Trips';

const TripsComponent = props => {
  return <TripsScene {...props} />;
};

TripsComponent.propTypes = {
  trip: PropTypes.object,
  scheduledServices: PropTypes.array,
  unScheduledServices: PropTypes.array,
};

export default TripsComponent;