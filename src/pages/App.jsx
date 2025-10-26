import { useState } from 'react'
import { TbSettings } from "react-icons/tb";
import { TbPlus } from "react-icons/tb";
import CharacterCard from '../components/CharacterCard.jsx'
import NewCharacterModal from '../components/NewCharacterModal.jsx'
import '../styles/App.css'
import charactersList from "../../server/data/characters.json"

function App() {
  // const [count, setCount] = useState(0)
  let [characters, setCharacters] = useState(charactersList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState(null);

  const iconsSize = 20;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCharacterToEdit(null);
  };

  const handleEditCharacter = (character) => {
    setCharacterToEdit(character);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCreateCharacter = async (newCharacter) => {
    if (newCharacter.hp > newCharacter.maxHp) {
      newCharacter.hp = newCharacter.maxHp;
    }

    try {
      const response = await fetch('http://localhost:3000/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCharacter.name,
          icon: newCharacter.icon,
          hp: newCharacter.hp,
          maxHp: newCharacter.maxHp
        })
      });

      if (response.ok)
        setCharacters([...characters, newCharacter]);
      else
        console.error('Erro ao criar personagem na API:', response.statusText);
    } catch (error) {
      console.error('Erro de rede ao criar personagem:', error);
    }
  };

  const handleUpdateCharacter = async (updatedCharacter) => {
    if (updatedCharacter.delete) {
      try {
        const response = await fetch(`http://localhost:3000/api/characters/${updatedCharacter.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const filteredCharacters = characters.filter(char => char.id !== updatedCharacter.id);
          setCharacters(filteredCharacters);
        } else {
          console.error('Erro ao deletar personagem na API:', response.statusText);
        }
      } catch (error) {
        console.error('Erro de rede ao deletar personagem:', error);
      }
      return;
    }

    if (updatedCharacter.hp > updatedCharacter.maxHp) {
      updatedCharacter.hp = updatedCharacter.maxHp;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/characters/${updatedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedCharacter.name,
          icon: updatedCharacter.icon,
          hp: updatedCharacter.hp,
          maxHp: updatedCharacter.maxHp
        })
      });

      if (response.ok) {
        const updatedCharacters = characters.map(char => 
          char.id === updatedCharacter.id ? updatedCharacter : char
        );
        setCharacters(updatedCharacters);
      } else
        console.error('Erro ao atualizar personagem na API:', response.statusText);
    } catch (error) {
      console.error('Erro de rede ao atualizar personagem:', error);
    }
  };

  return (
    <div className="App">
      <div className='navbar'>
        <button className='button'>
          <TbSettings size={iconsSize} />
          <p className='button-text'>Configurações</p>
        </button>
      </div>
      <div className='characters'>
        <div className='header'>
          <h2 className='title'>Personagens</h2>
          <button className='button' onClick={handleOpenModal}>
            <TbPlus size={iconsSize} />
            <p className='button-text'>Novo</p>
          </button>
        </div>
        <div className='list'>
          {characters.map((character, index) => (
            <CharacterCard
              id={character.id}
              key={index}
              name={character.name}
              icon={character.icon}
              hp={character.hp}
              maxHp={character.maxHp}
              onEdit={() => handleEditCharacter(character)}
            />
          ))}
        </div>
      </div>
      <NewCharacterModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateCharacter}
        onUpdate={handleUpdateCharacter}
        isEditing={isEditing}
        characterToEdit={characterToEdit}
      />
    </div>
  )
}

export default App
