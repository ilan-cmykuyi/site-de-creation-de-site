// src/App.tsx
import { Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { Blog } from "./pages/Blog";
import { BlogPost } from "./pages/BlogPost";
import { Home } from "./pages/Home";
import { Legal } from "./pages/Legal";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/mentions-legales" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
