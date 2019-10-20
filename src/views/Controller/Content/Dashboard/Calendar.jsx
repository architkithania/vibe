import React, { Component } from 'react';
import { Card, Alert, CardBody, Spinner} from 'reactstrap';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';
import BigCalendar from 'react-big-calendar';
import './react-big-calendar.css';
import Cookie from 'universal-cookie';
import Requests from '../../../../Requests';
import { Error } from "@material-ui/icons";

/**
 * This react component is the user's calender. 
 * After user authorizes vibe to access his
 * google calender, this component requests the data from google's API. 
 * The calender is then shown on the Dashboard of the user.
 * 
 * @states to keep track of the calenders events and to make sure 
 * that the calender is ready to render.
 */

const localizer = BigCalendar.momentLocalizer(moment);

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      calendarReady: false,
      events: null,
      isEventsDefined: false,
      errorLoadingCalendar: false,
      responseStatus: 0,
      eventlist: [{ id: 0 }]
    };
  }

  componentWillMount() {
    const sessionInfo = new Cookie().get('session-info');
    const options = {
      userId: sessionInfo.id,
      eventConfig: {
        timeMin: '2019-01-09T14:15:44+0000'
      },
      session: sessionInfo.session
    };
    Requests.post('api/calendars/accesscalendar', options).then(data => {
      if (data.status === 200) {
        this.setState({ calendarReady: true, events: data.body, responseStatus: 200 });
        
        let max = data.body.length;

        let temparr = [];
        for (var i = 0; i < max; i++) {
          temparr[i] = {
            title: data.body[i].summary,
            start: data.body[i].start.dateTime,
            end: data.body[i].end.dateTime,
          }
        }

        const resourceMap = [
          { resourceId: 1, resourceTitle: 'Central' },
          { resourceId: 2, resourceTitle: 'HKU Stadium' },
          { resourceId: 3, resourceTitle: 'Meeting room 1' },
          { resourceId: 4, resourceTitle: 'Hong Kong Science Park' }
        ];
        
        this.setState({
          isEventsDefined: true,
          eventlist: temparr
        });
      } else if(data.status === 403){
        this.setState({errorLoadingCalendar: true, responseStatus: 403});
      } else {
        this.setState({errorLoadingCalendar: true, response: 404})
      }
    });
  }

  render() {
    if (this.state.calendarReady) {
      return (
        <div id='calendar'>
          <Card id='calendarCard'>
            <CardBody>
              <h2 id='calendar-h2'>Calendar</h2>
              <BigCalendar
                localizer={localizer}
                events={this.state.eventlist}
                startAccessor='start'
                endAccessor='end'
                step={30}
                defaultView={BigCalendar.Views.MONTH}
                views={['month', 'agenda']}
                showMultiDayTimes
                selectable
              />
            </CardBody>
          </Card>
        </div>
      );
    } else if(this.state.errorLoadingCalendar === true){
      return(
        <div className = "calendarAlert">
          <Alert color = "dark" id = "alertMessage"> 
          <Error className = "mx-2" id = "errorIcon" />
          {(this.state.responseStatus === 403 ? "Google Calendar is not authorised" : "Error Loading Calendar")}
            
          </Alert>
        </div>
      );
    } 
    else {
      return (
        <div className="groups">
          <Spinner color="primary" id="calendarSpinner" />
        </div>
      );
    }
  }
}

export default Calendar;
