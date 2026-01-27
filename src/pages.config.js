import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Journal from './pages/Journal';
import Strategies from './pages/Strategies';
import AIAgent from './pages/AIAgent';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "Dashboard": Dashboard,
    "Trades": Trades,
    "Calendar": Calendar,
    "Analytics": Analytics,
    "Journal": Journal,
    "Strategies": Strategies,
    "AIAgent": AIAgent,
    "Settings": Settings,
    "Accounts": Accounts,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};