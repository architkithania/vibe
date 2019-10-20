import React, { Component } from "react";
import { Alert, Spinner, Container } from "reactstrap";
import { Error } from "@material-ui/icons";
import Cookie from "universal-cookie";
import GroupName from "./GroupName/GroupName";
import GroupHeader from "./GroupHeader/GroupHeader";
import GroupContent from "./GroupContent/GroupContent";
import GroupJoinCreate from "./GroupJoinCreate/GroupJoinCreate";
import Requests from "../../../../Requests";
import "./groups.css";

/**
 * This react component is responsible for displaying the group page and 
 * rendering the correct components based on the user's clicks.
 * 
 * Initially, the groups that the user is in are displayed using the GroupHeader component.
 * When user clicks on group, the GroupContent is rendered to display the group's content.
 * If user clicks to join or create group, the GroupJoinCreate component is rendered.
 * 
 * @states keep track whether the components are rendered successfully or not.
 */

class Groups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorLoadingGroups: false,
      groupsReady: false,
      groups: null,
      selected: null
    };
    this.sessionInfo = null;
  }

  changeSelect(newSelect, exitted = false) {
    if (!exitted && newSelect == null) {
      this.sessionInfo = new Cookie().get("session-info");
      const options = {
        id: this.sessionInfo.id,
        session: this.sessionInfo.session,
        dataNeeded: ["groups"]
      };
      Requests.post("api/users/load", options).then(data => {
        if (data.status === 200) {
          this.setState({ groupsReady: true, groups: data.body.groups, selected:null });
        } else {
          this.setState({ errorLoadingGroups: true, selected: null });
        }
      });
    }
    else {
      this.setState({ selected: newSelect });
    }
  }

  componentWillMount() {
    this.sessionInfo = new Cookie().get("session-info");
    const options = {
      id: this.sessionInfo.id,
      session: this.sessionInfo.session,
      dataNeeded: ["groups"]
    };
    Requests.post("api/users/load", options).then(data => {
      if (data.status === 200) {
        this.setState({ groupsReady: true, groups: data.body.groups });
      } else {
        this.setState({ errorLoadingGroups: true });
      }
    });
  }

  render() {
    if (this.state.groupsReady) {
      if (
        this.state.selected == null ||
        this.state.selected == "add" ||
        this.state.selected == "create"
      ) {
        const items = Object.values(this.state.groups).map(group => (
          <GroupName
            name={group.name}
            id={group.id}
            key={group.id}
            changeSelect={name => this.changeSelect(name)}
          />
        ));
        return (
          <div className="groups my-4">
            <Container>
              <GroupHeader changeSelect={name => this.changeSelect(name)} />
              {items}
              {this.state.selected == "add" ||
              this.state.selected == "create" ? (
                <GroupJoinCreate
                  method={this.state.selected}
                  changeSelect={(name, bool) => this.changeSelect(name, bool)}
                />
              ) : null}
            </Container>
          </div>
        );
      } else {
        return (
          <div className="mainDiv">
            <GroupContent
              changeSelect={name => this.changeSelect(name)}
              selected={this.state.selected}
              session={this.sessionInfo}
            />
          </div>
        );
      }
    } else if (this.state.errorLoadingGroups) {
      return (
        <div className="groups">
          <Alert color="dark" id="groupLoadError">
            <Error className="mx-2" id="errorIcon" />
            Cannot Load Groups
          </Alert>
        </div>
      );
    } else {
      return (
        <div className="groups">
          <Spinner color="primary" id="groupSpinner" />
        </div>
      );
    }
  }
}

export default Groups;
