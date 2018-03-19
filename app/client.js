import { createElement } from "react"
import { render } from "react-dom"
import { ExampleContainer } from "./containers/ExampleContainer";

const exampleMount = document.querySelectorAll("[data-js='example']")[0];

if (exampleMount) {
    render(createElement(ExampleContainer), exampleMount);
}
else {
    console.error("Example mount not found");
}
