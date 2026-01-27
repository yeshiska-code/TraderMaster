import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "Dashboard": Dashboard,
    "Trades": Trades,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};