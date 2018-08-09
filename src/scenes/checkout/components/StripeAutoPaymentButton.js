import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PaymentRequestButtonElement, injectStripe } from 'react-stripe-elements';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 100%;
  max-width: 500px;
  min-height: 40px;
`;

class StripeAutoPaymentButton extends Component {
  static propTypes = {
    amount: PropTypes.number.isRequired,
    onStripeTokenReceived: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { amount } = this.props;

    // For full documentation of the available paymentRequest options, see:
    // https://stripe.com/docs/stripe.js#the-payment-request-object
    const paymentRequest = props.stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: amount * 100, // multiplying by 100 as stripe always needs amount in cents
      },
    });

    paymentRequest.on('token', ({ complete, token, ...data }) => {
      console.log('Received Stripe token: ', token);
      console.log('Received customer information: ', data);
      this.props.onStripeTokenReceived(token, complete);
    });

    paymentRequest.canMakePayment().then(result => {
      this.setState({ canMakePayment: !!result });
    });

    this.state = {
      canMakePayment: false,
      paymentRequest,
    };
  }

  render() {
    return this.state.canMakePayment ? (
      <Wrapper>
        <PaymentRequestButtonElement
          paymentRequest={this.state.paymentRequest}
          className="PaymentRequestButton"
          style={{
            // For more details on how to style the Payment Request Button, see:
            // https://stripe.com/docs/elements/payment-request-button#styling-the-element
            paymentRequestButton: {
              theme: 'dark',
            },
          }}
        />
      </Wrapper>
    ) : null;
  }
}

export default injectStripe(StripeAutoPaymentButton);