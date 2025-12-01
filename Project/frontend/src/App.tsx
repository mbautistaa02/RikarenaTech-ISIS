import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { Header } from "./Components/Header";
import {Home} from "./pages/Home.tsx";
import {Sellers} from "./pages/Sellers.tsx";
import { Footer } from "./Components/Footer.tsx";
import {Profile} from "./pages/Profile.tsx";
import CreatePost from "./pages/CreatePost.tsx";
import {MyProducts} from "./pages/MyProducts.tsx";
import {ProductsBySeller} from "./pages/ProductsBySeller.tsx";
import ProductDetails from  "./pages/ProductDetails.tsx";
import {EditPost} from "./pages/EditPost.tsx";
import PanelDeModerador from "./pages/PanelDeModerador.tsx";

function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen w-screen">
                {/*  Header fijo arriba */}
                 <Header />

                {/*  Contenido principal con padding superior */}
                <main className="flex-grow pt-16">
                    <Routes>
                        <Route path="/products" element={<Home />} />
                        <Route path="/sellers" element={<Sellers />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/create_post" element={<CreatePost />} />
                        <Route path="/my_products" element={<MyProducts />} />
                        <Route path="/products-by-seller/:id" element={<ProductsBySeller />} />
                        <Route path="/product_details/:id" element={<ProductDetails />} />
                        <Route path="/edit_post/:id" element={<EditPost />} />
                        <Route path="/moderador" element={<PanelDeModerador />} />

                    </Routes>
                </main>

                {/*  Footer al final */}
                <Footer />
            </div>
        </Router>
    );
}

export default App;