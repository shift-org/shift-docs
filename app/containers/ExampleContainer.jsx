import * as React from "react";

import { ExampleComponent } from "../components/ExampleComponent";
import { Button } from "../components/Button";

export class ExampleContainer extends React.Component {
    constructor(props) {
        super(props)

        this.state = { counter: 0 }

        this.reset = this.reset.bind(this)
    }
    
    componentDidMount() {
        setInterval(() => {
            this.setState({counter: this.state.counter+1})
        }, 1000)
    }

    reset() {
        this.setState({counter: 0})
    }

    render() {
        return <div>
            <ExampleComponent exampleProp={this.state.counter} />
            <Button onClick={this.reset}>Reset timer</Button>
        </div>
    }
}
