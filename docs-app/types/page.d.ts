export interface Page {
  path: string;
  title: string;
  headings: { text: string; depth: number }[];
}
