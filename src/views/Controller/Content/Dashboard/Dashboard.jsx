import React, { Component } from 'react'
import {Row, Col} from 'reactstrap'
import EventCarasol from './EventCarasol'
import Calendar from './Calendar'
import './dashboard.css'

/**
 * This react component renders all the components in the Dashboard.
 * This includes, the events container and the calender.
 * The Events are displayed on top of the calender.
 */


class Dashboard extends Component {
  render() {
    return (
      <div id="dashboard">
        <Row >
          <Col id="eventsContainer">
            <EventCarasol />
          </Col>
        </Row>
        <Row>
          <Col id="calendarOuterCol">
            <Calendar />
          </Col>
        </Row>
      </div>
    )
  }
}

export default Dashboard;