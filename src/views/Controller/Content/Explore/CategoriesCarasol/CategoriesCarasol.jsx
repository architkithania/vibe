import React, { Component } from "react";
import {
  gamesIcon,
  coffeeIcon,
  birthdayIcon,
  sportsIcon,
  drinksIcon,
  diningIcon,
  outdoorIcon,
  meetingIcon,
  studyIcon
} from "../../../../../icons/icons";
import "./categoriesCarasol.css";

/**
 * This react component is the container for the logos representing the events'
 * categories. Upon clicking on any icon, the corresponding events made by all 
 * groups are displayed and the user can choose to join any number of events
 * he is interested in.
 * 
 * The component is split into two classes:
 * - Category which is responsible for each logo and its content.
 * - CategoriesCarasol which combines all the catagories and which one is pressed. 
 * 
 * @states
 * icon: all the icons representing events' categories.
 * color: keeps track of the color of each icon. The color changes when the user 
 * hovers on the icons. Each color is randomly generated. 
 */

class Category extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: "black",
      isOpen: false
    };
    this.icons = {
      Birthday: birthdayIcon,
      Sports: sportsIcon,
      Coffee: coffeeIcon,
      Games: gamesIcon,
      Drinks: drinksIcon,
      Dining: diningIcon,
      Outdoor: outdoorIcon,
      Meeting: meetingIcon,
      Study: studyIcon
    };
  }

  setColor(newColor) {
    this.setState({ color: newColor });
  }

  changeSelect() {
    if (this.state.isOpen) {
      this.props.changeSelect(null);
    }
    else {
      this.props.changeSelect(this.props.name);
      this.setState({isOpen: true});
    }
  }

  render() {
    return (
      <div
        className="caterogyCard mx-2"
        id={this.props.name}
        onMouseOver={() => this.setColor(this.props.color)}
        onMouseLeave={() => this.setColor("black")}
        onClick={() => this.changeSelect()}
        style={{ color: this.state.color }}
      >
        {this.icons[this.props.name]}
      </div>
    );
  }
}

class CategoriesCarasol extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: null
    };
  }

  render() {
    return (
      <div id="categories">
        <Category name="Drinks" color="#00b0ff" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Coffee" color="#8d6e63" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Dining" color="#ffca28" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Sports" color="#ffa726" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Games" color="#00b0ff" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Outdoor" color="#ff5722" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Study" color="#00e676" changeSelect={(name) => this.props.changeSelect(name)}/>
        <Category name="Meeting" color="#8d6e63" changeSelect={(name) => this.props.changeSelect(name)}/>
      </div>
    );
  }
}

export default CategoriesCarasol;
