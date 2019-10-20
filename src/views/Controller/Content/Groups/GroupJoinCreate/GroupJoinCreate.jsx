import React, { Component } from "react";
import {
  Form,
  FormGroup,
  Input,
  FormFeedback,
  Button,
  Spinner
} from "reactstrap";
import { Close } from "@material-ui/icons";
import Cookie from "universal-cookie";
import Requests from "../../../../../Requests";
import "./groupJoinCreate.css";

/**
 * This react component consists of 5 classes:
 * - Result which displays the result for the keywords searched by sending to the back-end.
 * - Search Results which is responsible to call the result class to display each result.
 * - JoinGroup which is responsible for adding the user to the group he wants to join 
 *    and send a request for the back-end to do that.
 * - CreateGroup which is responsible for creating group based on the data the 
 *   user entered and sending a request to back-end.
 * - GroupJoinCreate which is responsible for rendering the correct component 
 *   based on the user choice.
 */

class Result extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      added: false
    }
  }

  addJoin() {
    const sessionInfo = new Cookie().get('session-info');
    const options = {
      userId: sessionInfo.id,
      groupId: this.props.res.id,
      session: sessionInfo.session
    }
    Requests.post('api/groups/join', options).then(data => {
      if (data.status === 200) {
        this.props.changeSelect(null,false);
      }
    })
  }

  render() {
    return (
      <div className="searchResult">
        <div>
          {this.props.res.name}:{this.props.res.creator}
        </div>
        <div>
          <Button color="primary" onClick={() => this.addJoin()}>Join</Button>
        </div>
      </div>
    )
  }
}

class SearchResults extends Component {
  render() {
    const results = this.props.results.map(res => <Result res={res} key={res.id} changeSelect={(name, bool) => this.props.changeSelect(name, bool)}/>)
    return (
      <div>
        {results}
      </div>
    )
  }
}

class JoinGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      incompleteGroupName: false,
      loading: false,
      onPage: -1,
      results: [],
      searched: false
    };
  }

  handleJoin() {
    this.setState({
      loading: true,
      incompleteGroupName: false
    });
    const groupName = document.getElementById("groupName").value;
    if (groupName == "") {
      this.setState({ incompleteGroupName: true });
    } else {
      this.setState({ loading: true });
      Requests.get(`api/groups/search/${groupName}`).then(data => {
        if (data.status == 200) {
          this.setState({loading: false, results: data.body, searched: true });
        }
      });
    }
  }

  render() {
    let buttonArea;
    if (this.state.loading) {
      buttonArea = <Spinner color="primary" />;
    } else {
      buttonArea = (
        <Button
          color="primary"
          id="createGroupButton"
          onClick={e => this.handleJoin(e)}
        >
          Search
        </Button>
      );
    }
    return (
      <div className="upper-layer-groups pt-5">
        {this.state.loading ? (
          <Spinner color="primary" />
        ) : (
          <div>
            <span className="crossIconBg">
              <Close
                id="createGroupClose"
                onClick={() => this.props.changeSelect(null, true)}
              />
            </span>
            {!this.state.searched ? (
              <Form>
                <FormGroup>
                  <Input
                    type="text"
                    name="text"
                    placeholder="Group Name"
                    id="groupName"
                    autoComplete="false"
                    invalid={this.state.incompleteGroupName}
                  />
                  <FormFeedback>Group Name is Required</FormFeedback>
                </FormGroup>
                <div>{buttonArea}</div>
              </Form>
            ) : 
            <div>
              <SearchResults results={this.state.results} changeSelect={(name, bool) => this.props.changeSelect(name, bool)}/>
            </div>}
          </div>
        )}
      </div>
    );
  }
}

class CreateGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      incompleteTags: false,
      incompleteGroupName: false,
      loading: false
    };
  }

  handleLogin() {
    this.setState({
      loading: false,
      incompleteGroupName: false,
      incompleteTags: false
    });
    const groupName = document.getElementById("groupName").value;
    const groupTags = document.getElementById("tagsInput").value;
    const tags = groupTags.split(",");
    if (groupName == "") {
      this.setState({ incompleteGroupName: true });
    } else if (tags.length < 3) {
      this.setState({ incompleteTags: true });
    } else {
      this.setState({ loading: true });
      const sessionInfo = new Cookie().get("session-info");
      const options = {
        name: groupName,
        creator: {
          name: sessionInfo.firstName + " " + sessionInfo.lastName,
          id: sessionInfo.id
        },
        tags: tags,
        session: sessionInfo.session
      };
      Requests.post("api/groups/create", options).then(data => {
        if (data.status == 201) {
          this.props.changeSelect(null, false);
        }
      });
    }
  }

  render() {
    let buttonArea;
    if (this.state.loading) {
      buttonArea = <Spinner color="primary" />;
    } else {
      buttonArea = (
        <Button
          color="primary"
          id="createGroupButton"
          onClick={e => this.handleLogin(e)}>
          Create
        </Button>
      );
    }
    return (
      <div className="upper-layer-groups pt-5">
        {this.state.loading ? (
          <Spinner color="primary" />
        ) : (
          <div>
            <span className="crossIconBg">
              <Close
                id="createGroupClose"
                onClick={() => this.props.changeSelect(null, true)}
              />
            </span>
            <Form>
              <FormGroup>
                <Input
                  type="text"
                  name="text"
                  placeholder="Group Name"
                  id="groupName"
                  autoComplete="false"
                  invalid={this.state.incompleteGroupName}
                />
                <FormFeedback>Group Name is Required</FormFeedback>
              </FormGroup>
              <FormGroup>
                <Input
                  type="text"
                  name="tags"
                  placeholder="Tags"
                  id="tagsInput"
                  invalid={this.state.incompleteTags}
                />
                <FormFeedback>Input atleast 3 tags</FormFeedback>
              </FormGroup>
              <div>{buttonArea}</div>
            </Form>
          </div>
        )}
      </div>
    );
  }
}

class GroupJoinCreate extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div id="createJoinWindow">
          {this.props.method == "create" ? (
            <CreateGroup
              changeSelect={(name, bool) => this.props.changeSelect(name, bool)}
            />
          ) : <JoinGroup changeSelect={(name, bool) => this.props.changeSelect(name, bool)} />
          }
          <div className="blankdiv" />
        </div>
      </div>
    );
  }
}

export default GroupJoinCreate;
