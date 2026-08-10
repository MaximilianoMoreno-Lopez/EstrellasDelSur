// Remark plugin: esconder la cuota de socio en proyectos con la convocatoria cerrada.
//
// Cuando un proyecto pasa a `status: "past"` ya no se aceptan candidaturas, así que
// la ficha no debe seguir anunciando un precio: sin plazas que ofrecer, la cuota solo
// genera dudas ("¿tengo que pagar 200 €?") y correos preguntando por algo cerrado.
//
// El texto se queda en el Markdown (hace falta si la convocatoria se reabre y es el
// registro de lo que se cobró), pero no se publica: este plugin borra del AST el
// apartado "Cuota de Socio" completo, desde su encabezado hasta el siguiente
// encabezado del mismo nivel o superior. La fila "Coste" de la barra lateral se
// oculta aparte, en src/pages/proyectos/[slug].astro.
//
// Solo actúa sobre src/content/projects: las noticias también llevan
// `status: "past"` y no deben verse afectadas.

const FEE_HEADING = /cuota/i;

function headingText(node) {
  if (typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(headingText).join('');
}

export default function remarkStripClosedFee() {
  return (tree, file) => {
    const frontmatter = file?.data?.astro?.frontmatter;
    if (frontmatter?.status !== 'past') return;

    const path = (file?.path || file?.history?.[0] || '').replace(/\\/g, '/');
    if (!path.includes('/src/content/projects/')) return;

    const nodes = tree.children;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type !== 'heading' || !FEE_HEADING.test(headingText(node))) continue;

      let end = i + 1;
      while (
        end < nodes.length &&
        !(nodes[end].type === 'heading' && nodes[end].depth <= node.depth)
      ) {
        end++;
      }
      nodes.splice(i, end - i);
      i--;
    }
  };
}
