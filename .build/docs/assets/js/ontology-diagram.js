document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("ontology-diagram");

  if (!container || !window.ontologyDiagramElements || !window.cytoscape) {
    return;
  }

  if (window.cytoscapeDagre) {
    cytoscape.use(window.cytoscapeDagre);
  }

  const cy = cytoscape({
    container: container,

    elements: window.ontologyDiagramElements,

    style: [
      {
        selector: "node",
        style: {
          "shape": "round-rectangle",
          "background-color": "#f7f9fc",
          "border-color": "#2f5f9f",
          "border-width": 2,
          "label": "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": 12,
          "color": "#111",
          "width": "label",
          "height": "label",
          "padding": "14px"
        }
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#666",
          "line-color": "#888",
          "width": 1.5,
          "label": "data(label)",
          "font-size": 10,
          "text-background-color": "#fff",
          "text-background-opacity": 0.85,
          "text-background-padding": "2px",
          "text-rotation": "autorotate"
        }
      },
      {
        selector: "edge[type = 'subClassOf']",
        style: {
          "line-style": "dashed",
          "line-color": "#2f5f9f",
          "target-arrow-color": "#2f5f9f",
          "target-arrow-shape": "triangle",
          "label": "is a"
        }
      },
      {
        selector: "edge[type = 'objectProperty']",
        style: {
          "line-color": "#777",
          "target-arrow-color": "#777"
        }
      },
      {
        selector: ":selected",
        style: {
          "background-color": "#ffe08a",
          "line-color": "#d18b00",
          "target-arrow-color": "#d18b00",
          "border-color": "#d18b00"
        }
      }
    ],

    layout: {
      name: "dagre",
      rankDir: "TB",
      nodeSep: 60,
      rankSep: 100,
      fit: true,
      padding: 40
    },

    wheelSensitivity: 0.2
  });

  cy.on("tap", "node", function (event) {
    const node = event.target;
    const data = node.data();

    console.log("Class:", data.label, data.uri);
    console.log("Attributes:", data.attributes || []);
  });

  const fitButton = document.getElementById("diagram-fit");
  if (fitButton) {
    fitButton.addEventListener("click", function () {
      cy.fit(undefined, 40);
    });
  }

  const layoutButton = document.getElementById("diagram-layout");
  if (layoutButton) {
    layoutButton.addEventListener("click", function () {
      cy.layout({
        name: "dagre",
        rankDir: "TB",
        nodeSep: 60,
        rankSep: 100,
        fit: true,
        padding: 40
      }).run();
    });
  }

  window.ontologyDiagram = cy;
});
