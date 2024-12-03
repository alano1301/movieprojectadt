import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import './Movie.css'

function Movies() {

  const navigate = useNavigate();

  return (
    <>
        <div className='movies-header-container'>
          <div className='movies-header' onClick={() => navigate('/main/movies')}>Movies</div>
        </div>
        <Outlet />
    </>
  )
}

export default Movies