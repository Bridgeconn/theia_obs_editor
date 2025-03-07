import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

interface Section {
  id: number;
  imageUrl: string | undefined;
  text: string;
}

interface Content {
  title: string;
  sections: Section[];
  footnotes: string;
}

// Define the structure of AST nodes
interface MarkdownNode {
  type: string;
  depth?: number;
  children?: MarkdownNode[];
  value?: string;
  url?: string;
}

export const parseMarkdown = (markdown: string): Content => {
  const tree = unified().use(remarkParse).parse(markdown) as MarkdownNode;
  let title = "";
  let footnotes = "";
  const sections: Section[] = [];
  let currentId = 1;

  let lastImageSection: Section | null = null; // Store last image section for merging

  visit(tree, "heading", (node: MarkdownNode) => {
    if (node.depth === 1 && node.children) {
      title = node.children.map((child) => child.value || "").join("");
    }
  });

  visit(tree, "paragraph", (node: MarkdownNode) => {
    if (!node.children) return;

    let imageNode = node.children.find((child) => child.type === "image");
    let textContent = node.children
      .filter((child) => child.type === "text")
      .map((child) => child.value)
      .join(" ")
      .trim();

    if (imageNode) {
      // Store the image in lastImageSection in case a text follows
      lastImageSection = {
        id: currentId++,
        imageUrl: imageNode.url,
        text: "",
      };
      sections.push(lastImageSection);
    } else if (textContent) {
      if (lastImageSection && lastImageSection.text === "") {
        // Merge text with the last image section
        lastImageSection.text = textContent;
        lastImageSection = null; // Reset after merging
      } else {
        // Normal text paragraph, store as new section
        sections.push({
          id: currentId++,
          imageUrl: undefined,
          text: textContent,
        });
      }
    }
  });

  visit(tree, "paragraph", (node: MarkdownNode) => {
    if (!node.children) return;
    let emphasisNode = node.children.find((child) => child.type === "emphasis");
    if (emphasisNode && emphasisNode.children) {
      footnotes += emphasisNode.children.map((child) => child.value || "").join(" ") + " ";
    }
  });

  return { title, sections, footnotes: footnotes.trim() };
};

export const convertToMarkdown = (content: Content): string => {
  if (!content) return "";

  let markdown = `# ${content.title}\n\n`;

  content.sections.forEach((section: Section) => {
    if (section.imageUrl) {
      markdown += `![OBS Image](${section.imageUrl})\n\n`;
    }
    if (section.text.trim()) {
      markdown += `${section.text}\n\n`;
    }
  });

  if (content.footnotes) {
    markdown += `_${content.footnotes}_\n`;
  }

  return markdown;
};
