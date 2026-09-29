import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LiveListPage from './pages/LiveListPage';
import LiveRoomPage from './pages/LiveRoomPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LiveListPage />} />
        <Route path='/live' element={<LiveRoomPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;