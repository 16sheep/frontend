// NPM
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// COMPONENTS
import Carousel from "../../../shared_components/Carousel";
import TripCart from "../../../shared_components/Carts/Trip";

// ACTIONS/CONFIG

// STYLES
import {
  PageWrapper,
  SectionWrap,
  SectionHeader,
  SectionContent,
  More
} from "../../../shared_components/layout/Page";

// MODULE
export default function HomeSectionPlaces({ trips }) {
  return (
    <PageWrapper>
      <SectionWrap>
        <SectionHeader>
          <h3>Popular places</h3>
          <More>
            <Link to="/places">All places</Link>
          </More>
        </SectionHeader>
        <SectionContent>
          <Carousel show="4" length={trips.length} shadowInside withLoader>
            {trips.map(item => (
              <TripCart
                item={item}
                withShadow
                key={item.title}
                xsBasis="50%"
                mdBasis="25%"
              />
            ))}
          </Carousel>
        </SectionContent>
      </SectionWrap>
    </PageWrapper>
  );
}

// Props Validation
HomeSectionPlaces.propTypes = {
  trips: PropTypes.arrayOf(PropTypes.object)
};