import React, { Component } from "react";
import CategoriesCaresol from "./CategoriesCarasol/CategoriesCarasol";
import CategoriesContent from './CategoriesContent/CategoriesContent'
import "./explore.css";

/**
 * This react component renders the events in the selected event's logo.
 * Each logo corresponds to an event's category. This helps user explore different
 * events that are organised by groups he is not part of. 
 */

class Explore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: null
    };
  }

  changeSelect(newSelect) {
    this.setState({selected: newSelect});
  } 

  render() {
    return (
      <div className="explore">
        <CategoriesCaresol changeSelect={(name) => this.changeSelect(name)}/>
        {this.state.selected !== null ? (
          <CategoriesContent name={this.state.selected} />
        ) : null}
      </div>
    );
  }
}

export default Explore;
