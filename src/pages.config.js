import AIAgent from './pages/AIAgent';
import Accounts from './pages/Accounts';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import CoachDashboard from './pages/CoachDashboard';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import Strategies from './pages/Strategies';
import TradeDetail from './pages/TradeDetail';
import Trades from './pages/Trades';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAgent": AIAgent,
    "Accounts": Accounts,
    "AdminPanel": AdminPanel,
    "Analytics": Analytics,
    "Calendar": Calendar,
    "CoachDashboard": CoachDashboard,
    "Dashboard": Dashboard,
    "Journal": Journal,
    "Landing": Landing,
    "Settings": Settings,
    "Strategies": Strategies,
    "TradeDetail": TradeDetail,
    "Trades": Trades,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};