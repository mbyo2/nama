import Image from "@tiptap/extension-image";

// Image extension with a stored width (px or %) and a drag-to-resize node view.
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("width") || element.style.width || null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width, style: `width: ${attributes.width}` };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "rte-image-wrapper";
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.lineHeight = "0";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      if (node.attrs.title) img.title = node.attrs.title;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "2px";
      if (node.attrs.width) img.style.width = node.attrs.width;
      wrapper.appendChild(img);

      const handle = document.createElement("span");
      handle.className = "rte-image-handle";
      handle.contentEditable = "false";
      wrapper.appendChild(handle);

      const showHandle = (show: boolean) => {
        handle.style.opacity = show ? "1" : "0";
      };
      showHandle(false);
      wrapper.addEventListener("mouseenter", () => showHandle(true));
      wrapper.addEventListener("mouseleave", () => showHandle(false));

      let startX = 0;
      let startWidth = 0;

      const onPointerMove = (e: PointerEvent) => {
        const delta = e.clientX - startX;
        const parentWidth = (wrapper.parentElement?.clientWidth || startWidth + delta) || 1;
        let next = Math.max(40, Math.min(startWidth + delta, parentWidth));
        img.style.width = `${next}px`;
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        const finalWidth = `${Math.round(img.getBoundingClientRect().width)}px`;
        if (typeof getPos === "function") {
          editor
            .chain()
            .command(({ tr }) => {
              tr.setNodeMarkup(getPos(), undefined, {
                ...node.attrs,
                width: finalWidth,
              });
              return true;
            })
            .run();
        }
      };

      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startWidth = img.getBoundingClientRect().width;
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      });

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== node.type.name) return false;
          if (updatedNode.attrs.src !== img.src) img.src = updatedNode.attrs.src;
          img.style.width = updatedNode.attrs.width || "";
          return true;
        },
      };
    };
  },
});
