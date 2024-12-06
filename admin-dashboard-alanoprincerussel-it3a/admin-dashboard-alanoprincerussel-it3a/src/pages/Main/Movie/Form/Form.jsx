import axios from 'axios';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Outlet, useOutlet } from 'react-router-dom'; // Add Outlet here
import { AuthContext } from '../../../../context/context';
import './Form.css';
import { useDebounce } from '../../../../utils/hooks/useDebounce';

const Form = () => {
  // User token and information
  const { auth } = useContext(AuthContext);

  const [query, setQuery] = useState('');
  const [searchedMovieList, setSearchedMovieList] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null); // Fixed initialization to null

  const titleRef = useRef();
  const overviewRef = useRef();
  const popularityRef = useRef();
  const release_dateRef = useRef();
  const vote_averageRef = useRef();
  const posterRef = useRef();
  const is_featuredRef = useRef();

  const [status, setStatus] = useState('idle');
//   const [movie,setMovie] = useState(undefined); // movie missing
  let { movieId } = useParams();

  const userInputDebounce = useDebounce({ selectedMovie }, 2000);
  const [debounceState, setDebounceState] = useState(false);
  const [isFieldsDirty, setIsFieldsDirty] = useState(false);

  const handleOnChange = (e) => {
    setDebounceState(false);
    setIsFieldsDirty(true);
    const { name, value } = e.target;

    setSelectedMovie((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Debounce
  useEffect(() => {
    setDebounceState(true);
  }, [userInputDebounce]);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayRef = useRef(null);

  const debounceTimer = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Alert box
  const [alertMessage, setAlertMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();
  const outletContent = useOutlet();


  // Debounce function
  const debounce = (func, delay) => {
    return (...args) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Search for movie
  const handleSearch = useCallback((value, page = 1) => {
    if (value.trim() === '') {
      setSearchedMovieList([]);
      setOverlayVisible(false);
      return;
    }
    axios({
      method: 'get',
      url: `https://api.themoviedb.org/3/search/movie?query=${value}&include_adult=false&language=en-US&page=${page}`,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZjcwNmYyZDQwMDA0ZTUwYzhmOGUwZDg4MWNjMzMzMCIsIm5iZiI6MTczMjQ0MTE3NS41MTcwNjI3LCJzdWIiOiI2NzEzMzc3MjY1MDI0OGI5ZGI2MWQ3MzgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.3YXaI8G0Zhq_JUCBQ2rd8F1R62ePiRNlV-Qom94OzgM', // Replace with your actual API key
      },
    }).then((response) => {
      setSearchedMovieList(response.data.results);
      setTotalPages(response.data.total_pages);
      if (response.data.results.length > 0) {
        setOverlayVisible(true);
      } else {
        setOverlayVisible(false);
      }
      console.log(response.data.results);
    }).catch(error => {
      console.error("Error fetching data: ", error);
    });
  }, []);

  // Debounced search text
  const debouncedSearch = useRef(debounce(handleSearch, 300)).current;

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSearch(value);
    setCurrentPage(1);
  };

  // Handle select movie
  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setOverlayVisible(false);
  };

  // Handle click outside of overlay
  const handleClickOutside = (event) => {
    if (overlayRef.current && !overlayRef.current.contains(event.target)) {
      setOverlayVisible(false);
    }
  };

  // Handle Save movie
  const handleSave = () => {
    setStatus('loading');
    if (!selectedMovie) {
      alert('Please search and select a movie.');
    } else {
      const data = {
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        overview: selectedMovie.overview,
        popularity: selectedMovie.popularity,
        releaseDate: selectedMovie.release_date,
        voteAverage: selectedMovie.vote_average,
        backdropPath: `https://image.tmdb.org/t/p/original/${selectedMovie.backdrop_path}`,
        posterPath: `https://image.tmdb.org/t/p/original/${selectedMovie.poster_path}`,
        isFeatured: selectedMovie.is_featured,
      };

      axios({
        method: 'post',
        url: '/movies',
        data: data,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      })
        .then((saveResponse) => {
        console.log(saveResponse);
          setIsError(false);
          setAlertMessage(saveResponse.data.message);
          setTimeout(() => {
            setAlertMessage('');
            navigate('/main/movies');
          }, 3000);
        })
        .catch((error) => {
          setIsError(true);
          setAlertMessage("An error has occurred! Please try again later!");
          setTimeout(() => {
            setAlertMessage('');
          }, 3000);
        });
    }
  };

  // Handle Update movie
  const handleUpdate = (id) => {
    setStatus('loading');
    if (!selectedMovie) {
      return;
    } else {
      const data = {
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        overview: selectedMovie.overview,
        popularity: selectedMovie.popularity,
        releaseDate: selectedMovie.release_date,
        voteAverage: selectedMovie.vote_average,
        backdropPath: `https://image.tmdb.org/t/p/original/${selectedMovie.backdrop_path}`,
        posterPath: `https://image.tmdb.org/t/p/original/${selectedMovie.poster_path}`,
        isFeatured: selectedMovie.is_featured,
      };
      axios({
        method: 'patch',
        url: `/movies/${id}`,
        data: data,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      })
        .then((saveResponse) => {
          setIsError(false);
          setAlertMessage(saveResponse.data.message);
          setTimeout(() => {
            setAlertMessage('');
            navigate('/main/movies');
          }, 3000);
        })
        .catch((error) => console.log(error));
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    if (movieId) {
      axios.get(`/movies/${movieId}`).then((response) => {
        // setMovie(response.data);

        let temp = 0;
        if(response.data.isFeatured === true){
          temp = 1
        }

        const tempData = {
          id: response.data.tmdbId,
          tmdbId: response.data.id,
          title: response.data.title,
          overview: response.data.overview,
          popularity: response.data.popularity,
          poster_path: response.data.posterPath,
          release_date: response.data.releaseDate,
          vote_average: response.data.voteAverage,
          is_featured: temp,
        };
        setSelectedMovie(tempData);
      }).catch(error => console.error("Error fetching movie data: ", error));
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [movieId]);

  const path = window.location.pathname;
  const parts = path.split('/');
  const tab = parts[5] || 'description'
  const [selectedTab, setSelectedTab] = useState('');

  useEffect(()=>{
    switch (tab) {
      case 'cast-and-crews':
        setSelectedTab('casts');
        break;
      case 'videos':
        setSelectedTab('videos');
        break;
      case 'photos':
        setSelectedTab('photos');
        break;
      default:
        setSelectedTab('description');
    }
  },[tab])


  return (
    <>
      <div className="form-header">
        {alertMessage && (<div className={`alert-box ${isError ? 'error' : 'success'}`}>{alertMessage}</div>)}
        <div className='tabs-container'>
          <span>
            <h2>{movieId ? 'Edit' : 'Create'} Movie</h2>
            <div className='tabs-container-group'>
              {movieId === undefined && (
                <div className='search-container'>
                  <input
                    type='text'
                    onChange={handleInputChange}
                    placeholder='Search movie'
                  />
                  <span className='fas fa-search' type='button' onClick={() => handleSearch(query)}></span>
                  <div className={`searched-movie ${overlayVisible ? 'show' : ''}`} ref={overlayRef}>
                    <div className='container'>
                      <div className="movie-list">
                        {searchedMovieList.map((movie) => (
                          <p key={movie.id} onClick={() => handleSelectMovie(movie)}>
                            {movie.original_title}
                          </p>
                        ))}
                    </div>
                                    <div className="pagination">
                {currentPage > 1 && (
                    <button onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        handleSearch(query, newPage);
                    }}>
                     Previous  {/* Left Arrow (Unicode) */}
                    </button>
                )}
                {currentPage < totalPages && (
                    <button onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        handleSearch(query, newPage);
                    }}>
                    Next  {/* Right Arrow (Unicode) */}
                    </button>
                )}
                </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                id='saveButton'
                type='button'
                disabled={status === 'loading'}
                onClick={() => {
                  if (status === 'loading') {
                    return;
                  }
                  const { title, overview, popularity, release_date, vote_average, is_featured } = selectedMovie;
                  if (title && overview && popularity && release_date && vote_average && is_featured) {
                    movieId !== undefined ? handleUpdate(movieId) : handleSave();
                  } else {
                    //fields are incomplete
                    setIsFieldsDirty(true);
                    //focus if field is empty
                    if (!title) {
                      titleRef.current.focus();
                    } else if (!overview) {
                      overviewRef.current.focus();
                    } else if (!popularity) {
                      popularityRef.current.focus();
                    } else if (!release_date) {
                      release_dateRef.current.focus();
                    } else if (!vote_average) {
                      vote_averageRef.current.focus();
                    } else if (!is_featured) {
                      is_featuredRef.current.focus();
                    }
                  }
                }}
              >
                {status === 'idle' ? 'SAVE' : 'loading'}
              </button>
            </div>
          </span>
          {movieId !== undefined && selectedMovie && (
            <nav>
              <div className='tabs'>
                <li
                  onClick={() => {
                    navigate(`/main/movies/form/${movieId}`);
                    setSelectedTab('description');
                  }}
                  className={selectedTab === 'description' ? 'active-tab' : ''}
                >
                  Description
                </li>
                <li
                  onClick={() => {
                    navigate(`/main/movies/form/${movieId}/cast-and-crews/${selectedMovie.id}`);
                    setSelectedTab('casts');
                  }}
                  className={selectedTab === 'casts' ? 'active-tab' : ''}
                >
                  Casts
                </li>
                <li
                  onClick={() => {
                    navigate(`/main/movies/form/${movieId}/videos/${selectedMovie.id}`);
                    setSelectedTab('videos');
                  }}
                  className={selectedTab === 'videos' ? 'active-tab' : ''}
                >
                  Videos
                </li>
                <li
                  onClick={() => {
                    navigate(`/main/movies/form/${movieId}/photos/${selectedMovie.id}`);
                    setSelectedTab('photos');
                  }}
                  className={selectedTab === 'photos' ? 'active-tab' : ''}
                >
                  Photos
                </li>
              </div>
            </nav>
            )}
        </div>
      </div>

      {outletContent ? (
        <Outlet />
      ) : (
        <div className='movie-container'>
          <form>
            <div className="col movie-details">
              <div className='field'>
                <label>Title:</label>
                <input
                  type='text'
                  value={selectedMovie ? selectedMovie.title : ''}
                  required
                  name='title'
                  onChange={handleOnChange}
                  ref={titleRef}
                />
                {debounceState && isFieldsDirty && selectedMovie?.title === '' && (<span className='errors'>This field is required</span>)}
              </div>
              <div className='field text-area'>
                <label>Overview:</label>
                <textarea
                  rows={5}
                  value={selectedMovie ? selectedMovie.overview : ''}
                  required
                  name='overview'
                  onChange={handleOnChange}
                  ref={overviewRef}
                />
                {debounceState && isFieldsDirty && selectedMovie?.overview === '' && (<span className='errors'>This field is required</span>)}
              </div>
              <div className='field'>
                <label>Popularity:</label>
                <input
                  type='number'
                  value={selectedMovie ? selectedMovie.popularity : ''}
                  required
                  name='popularity'
                  onChange={handleOnChange}
                  ref={popularityRef}
                />
                {debounceState && isFieldsDirty && selectedMovie?.popularity === '' && (<span className='errors'>This field is required</span>)}
              </div>
              <div className='field'>
                <label>Release date:</label>
                <input
                  type='text'
                  value={selectedMovie ? selectedMovie.release_date : ''}
                  required
                  name='release_date'
                  onChange={handleOnChange}
                  ref={release_dateRef}
                />
                {debounceState && isFieldsDirty && selectedMovie?.release_date === '' && (<span className='errors'>This field is required</span>)}
              </div>
              <div className='field'>
                <label>Vote average:</label>
                <input
                  type='number'
                  value={selectedMovie ? selectedMovie.vote_average : ''}
                  required
                  name='vote_average'
                  onChange={handleOnChange}
                  ref={vote_averageRef}
                />
                {debounceState && isFieldsDirty && selectedMovie?.vote_average === '' && (<span className='errors'>This field is required</span>)}
              </div>
              <div className='field'>
                <label>is featured:</label>
                <select
                  value={selectedMovie ? selectedMovie.is_featured : ''}
                  required
                  name='is_featured'
                  onChange={handleOnChange}
                  ref={is_featuredRef}
                  className='custom-select'
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
                {debounceState && isFieldsDirty && selectedMovie?.is_featured === '' && (
                  <span className='errors'>This field is required</span>
                )}
              </div>
            </div>

            <div className="col poster-col">
              <img
                className='poster-image'
                src={selectedMovie?.poster_path 
                    ? `https://image.tmdb.org/t/p/original/${selectedMovie.poster_path}` 
                    : "/movieposter.jpg"}alt={`selectedMovie.original_title`}
                ref={posterRef}
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Form;
