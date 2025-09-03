import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import Page_0 from "./pages/_index.tsx";
import PageLayout_0 from "./pages/_index.pageLayout.tsx";
import Page_1 from "./pages/register.tsx";
import PageLayout_1 from "./pages/register.pageLayout.tsx";
import Page_2 from "./pages/dashboard.tsx";
import PageLayout_2 from "./pages/dashboard.pageLayout.tsx";
import Page_3 from "./pages/user.profile.tsx";
import PageLayout_3 from "./pages/user.profile.pageLayout.tsx";
import Page_4 from "./pages/user-dashboard.tsx";
import PageLayout_4 from "./pages/user-dashboard.pageLayout.tsx";
import Page_5 from "./pages/admin-dashboard.tsx";
import PageLayout_5 from "./pages/admin-dashboard.pageLayout.tsx";
import Page_6 from "./pages/business-dashboard.tsx";
import PageLayout_6 from "./pages/business-dashboard.pageLayout.tsx";
import Page_7 from "./pages/user-checkout-demo.tsx";
import PageLayout_7 from "./pages/user-checkout-demo.pageLayout.tsx";
import Page_8 from "./pages/admin.user-management.tsx";
import PageLayout_8 from "./pages/admin.user-management.pageLayout.tsx";
import Page_9 from "./pages/admin.business-management.tsx";
import PageLayout_9 from "./pages/admin.business-management.pageLayout.tsx";
import Page_10 from "./pages/business-products.tsx";
import BusinessProductsPageLayout from "./pages/business-products.pageLayout.tsx";

if (!window.requestIdleCallback) {
  window.requestIdleCallback = (cb) => {
    setTimeout(cb, 1);
  };
}

import "./base.css";

const fileNameToRoute = new Map([["./pages/_index.tsx","/"],["./pages/register.tsx","/register"],["./pages/dashboard.tsx","/dashboard"],["./pages/user.profile.tsx","/user/profile"],["./pages/user-dashboard.tsx","/user-dashboard"],["./pages/admin-dashboard.tsx","/admin-dashboard"],["./pages/business-dashboard.tsx","/business-dashboard"],["./pages/user-checkout-demo.tsx","/user-checkout-demo"],["./pages/admin.user-management.tsx","/admin/user-management"],["./pages/admin.business-management.tsx","/admin/business-management"],["./pages/business-products.tsx","/business-products"]]);
const fileNameToComponent = new Map([
    ["./pages/_index.tsx", Page_0],
["./pages/register.tsx", Page_1],
["./pages/dashboard.tsx", Page_2],
["./pages/user.profile.tsx", Page_3],
["./pages/user-dashboard.tsx", Page_4],
["./pages/admin-dashboard.tsx", Page_5],
["./pages/business-dashboard.tsx", Page_6],
["./pages/user-checkout-demo.tsx", Page_7],
["./pages/admin.user-management.tsx", Page_8],
["./pages/admin.business-management.tsx", Page_9],
["./pages/business-products.tsx", Page_10],
  ]);

function makePageRoute(filename: string) {
  const Component = fileNameToComponent.get(filename);
  return <Component />;
}

function toElement({
  trie,
  fileNameToRoute,
  makePageRoute,
}: {
  trie: LayoutTrie;
  fileNameToRoute: Map<string, string>;
  makePageRoute: (filename: string) => React.ReactNode;
}) {
  return [
    ...trie.topLevel.map((filename) => (
      <Route
        key={fileNameToRoute.get(filename)}
        path={fileNameToRoute.get(filename)}
        element={makePageRoute(filename)}
      />
    )),
    ...Array.from(trie.trie.entries()).map(([Component, child], index) => (
      <Route
        key={index}
        element={
          <Component>
            <Outlet />
          </Component>
        }
      >
        {toElement({ trie: child, fileNameToRoute, makePageRoute })}
      </Route>
    )),
  ];
}

type LayoutTrieNode = Map<
  React.ComponentType<{ children: React.ReactNode }>,
  LayoutTrie
>;
type LayoutTrie = { topLevel: string[]; trie: LayoutTrieNode };
function buildLayoutTrie(layouts: {
  [fileName: string]: React.ComponentType<{ children: React.ReactNode }>[];
}): LayoutTrie {
  const result: LayoutTrie = { topLevel: [], trie: new Map() };
  Object.entries(layouts).forEach(([fileName, components]) => {
    let cur: LayoutTrie = result;
    for (const component of components) {
      if (!cur.trie.has(component)) {
        cur.trie.set(component, {
          topLevel: [],
          trie: new Map(),
        });
      }
      cur = cur.trie.get(component)!;
    }
    cur.topLevel.push(fileName);
  });
  return result;
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Go back to the <a href="/" style={{ color: 'blue' }}>home page</a>.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          {toElement({ trie: buildLayoutTrie({
"./pages/_index.tsx": PageLayout_0,
"./pages/register.tsx": PageLayout_1,
"./pages/dashboard.tsx": PageLayout_2,
"./pages/user.profile.tsx": PageLayout_3,
"./pages/user-dashboard.tsx": PageLayout_4,
"./pages/admin-dashboard.tsx": PageLayout_5,
"./pages/business-dashboard.tsx": PageLayout_6,
"./pages/user-checkout-demo.tsx": PageLayout_7,
"./pages/admin.user-management.tsx": PageLayout_8,
"./pages/admin.business-management.tsx": PageLayout_9,
"./pages/business-products.tsx": [BusinessProductsPageLayout],
}), fileNameToRoute, makePageRoute })} 
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
