import React, { Component } from "react";
import { Spinner, Alert, Button } from "reactstrap";
import { Error, CheckCircleOutline } from "@material-ui/icons";
import Requests from "../../../../../Requests";
import Cookie from "universal-cookie";
import "./categoriesContent.css";

/**
 * This react component gets all the events from the all categories and sorts them
 * under their specific categories. The user can select and join any events he like by 
 * clicking "join". 
 * 
 * This component is split into two classes: 
 * ResultCard which is responsible to sort the events into cards.  
 * CategoriesContent which loads many ResultCard components depending on 
 * how many events there are under the specific category chosen.
 */

class ResultCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      added: false
    };
  }

  handleClick() {
    const sessionInfo = new Cookie().get("session-info");
    this.setState({ isLoading: true });
    Requests.post("/api/groups/join/", {
      userId: sessionInfo.id,
      groupId: this.props.groupId,
      session: sessionInfo.session
    }).then(_ => {
      const name = `${sessionInfo.firstName} ${sessionInfo.lastName}`;
      Requests.post("/api/events/join", {
        eventId: this.props.id,
        groupId: this.props.groupId,
        name: name,
        id: sessionInfo.id,
        session: sessionInfo.session
      }).then(_ => {
        this.setState({ added: true, isLoading: false });
      });
    });
  }

  render() {
    return (
      <div className="resultCard">
        <span>{this.props.name}</span>
        <span className="resultButtonArea">
          {this.state.added ? (
            <CheckCircleOutline className="addedCheck" />
          ) : this.state.isLoading ? (
            <Spinner color="primary" />
          ) : (
            <Button color="primary" onClick={() => this.handleClick()}>
              Join
            </Button>
          )}
        </span>
      </div>
    );
  }
}

class CategoriesContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contentReady: false,
      contents: null,
      contentError: false,
      onPage: 0,
      loadingNext: false,
      allLoaded: false,
      groups: []
    };
  }

  componentWillMount() {
    Requests.get(`api/events/search/${this.props.name}?max=5&count=0`).then(
      data => {
        const sessionInfo = new Cookie().get("session-info");
        const options = {
          id: sessionInfo.id,
          dataNeeded: ["groups"],
          session: sessionInfo.session
        };
        Requests.post("api/users/load", options).then(groups => {
          if (data.status == 200 && groups.status == 200) {
            const ids = Object.keys(groups.body.groups);
            this.setState({
              contents: data.body,
              contentReady: true,
              onPage: 1,
              allLoaded: data.body.length == 0,
              groups: ids
            });
          } else {
            this.setState({ contentError: true });
          }
        });
      }
    );
  }

  loadNext() {
    this.setState({ loadingNext: true });
    Requests.get(
      `api/events/search/${this.props.name}?max=5&count=${this.state.onPage}`
    ).then(data => {
      if (data.status == 200) {
        this.setState(prevState => ({
          contents: [...prevState.contents, ...data.body],
          loadingNext: false,
          onPage: prevState.onPage + 1,
          allLoaded: data.body.length == 0
        }));
      } else {
        this.setState({ contentError: true });
      }
    });
  }

  render() {
    if (this.state.contentReady) {
      const results = this.state.contents.map(con => {
        if (!this.state.groups.includes(con.groupId))
          return (
            <ResultCard
              name={con.name}
              id={con.id}
              key={con.id}
              groupId={con.groupId}
            />
          );
      });
      return (
        <div className="categoriesContent">
          {results}
          {this.state.allLoaded ? null : this.state.loadingNext ? (
            <Spinner type="grow" color="primary" />
          ) : (
            <Button color="primary" onClick={() => this.loadNext()}>
              Load More
            </Button>
          )}
        </div>
      );
    } else if (this.state.contentError) {
      return (
        <div className="categoriesLoaderError">
          <Alert color="dark" id="groupLoadError">
            <Error className="mx-2" id="errorIcon" />
            Cannot Load {this.props.name}
          </Alert>
        </div>
      );
    } else {
      return (
        <div className="categoriesLoaderError">
          <Spinner color="primary" className="categoriesSpinner" />
        </div>
      );
    }
  }
}

export default CategoriesContent;
