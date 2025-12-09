import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Footer } from "./Components/Footer.tsx";
import { Header } from "./Components/Header";
import Alerts from "./pages/Alerts.tsx";
import CreateCrop from "./pages/CreateCrop.tsx";
import CreatePost from "./pages/CreatePost.tsx";
import { EditPost } from "./pages/EditPost.tsx";
import { Home } from "./pages/Home.tsx";
import { MyProducts } from "./pages/MyProducts.tsx";
import PanelDeModerador from "./pages/PanelDeModerador.tsx";
import ProductDetails from "./pages/ProductDetails.tsx";
import { ProductsBySeller } from "./pages/ProductsBySeller.tsx";
import { Profile } from "./pages/Profile.tsx";
import { Sellers } from "./pages/Sellers.tsx";
import ScrollToTop from "./ScrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen w-screen">
        <Header />

        <main className="flex-grow pt-16">
          <Routes>
            {/* 👉 Ruta para "/" */}
            <Route path="/" element={<Navigate to="/products" />} />

            <Route path="/products" element={<Home />} />
            <Route path="/sellers" element={<Sellers />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create_post" element={<CreatePost />} />
            <Route path="/create_crop" element={<CreateCrop />} />
            <Route path="/my_products" element={<MyProducts />} />
            <Route
              path="/products-by-seller/:id"
              element={<ProductsBySeller />}
            />
            <Route path="/product_details/:id" element={<ProductDetails />} />
            <Route path="/edit_post/:id" element={<EditPost />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/moderador" element={<PanelDeModerador />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
