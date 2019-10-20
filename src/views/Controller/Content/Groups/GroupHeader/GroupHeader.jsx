import React from 'react'
import { Row, Col } from 'reactstrap'
import { Add,Create } from '@material-ui/icons'
import './groupHeader.css'

/**
 * This react component is responsible for the pencil and plus icons. The pencil icon
 * allows user to create groups while the plus icon allows the user to search
 * and join existing groups.
 */
const GroupHeader = props => {
  return (
    <Row id="groupHeaderToolbar">
      <Col>
        <span className="innerhighspan">
          <span className="iconbg" onClick={() => props.changeSelect('add')}>
            <Add className="headerIcon"/>
          </span>
          <span className="iconbg" onClick={() => props.changeSelect('create')}>
            <Create className="headerIcon"/>
          </span>
        </span>
      </Col>
    </Row>
  );
}

export default GroupHeader;