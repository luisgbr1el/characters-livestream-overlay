import { useState } from 'react'
import { CiSettings } from "react-icons/ci";
import { IoIosAddCircleOutline } from "react-icons/io";
import CharacterCard from '../components/CharacterCard.jsx'
import '../styles/App.css'
import charactersList from "../../server/data/characters.json"

function App() {
  // const [count, setCount] = useState(0)
  let [characters, setCharacters] = useState(charactersList);

  const iconsSize = 20;

  return (
    <div className="App">
      <div className='navbar'>
        <button>
          <CiSettings size={iconsSize} />
          <p className='button-text'>Configurações</p>
        </button>
      </div>
      <div className='characters'>
        <div className='header'>
          <h2 className='title'>Personagens</h2>
          <button>
            <IoIosAddCircleOutline size={iconsSize} />
            <p className='button-text'>Novo</p>
          </button>
        </div>
        <div className='list'>
          {characters.map((character, index) => (
            <CharacterCard
              key={index}
              name={character.name}
              icon={character.icon}
              hp={character.hp}
              maxHp={character.maxHp}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
