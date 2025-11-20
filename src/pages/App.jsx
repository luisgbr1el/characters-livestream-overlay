import { useState } from 'react'
import { TbSettings, TbPlus, TbTools } from "react-icons/tb";
import CharacterCard from '../components/CharacterCard.jsx'
import NewCharacterModal from '../components/NewCharacterModal.jsx'
import SettingsModal from '../components/SettingsModal.jsx'
import HealthManagementModal from '../components/HealthManagementModal.jsx';
import CharacterManagementModal from '../components/CharacterManagementModal.jsx';
import '../styles/App.css'
import charactersList from "../../server/data/characters.json"
import { useI18n } from '../i18n/i18nContext';
import { useAlert } from '../hooks/useAlert.jsx';

function App() {
  const { t } = useI18n();
  const { showAlert } = useAlert();
  let [characters, setCharacters] = useState(charactersList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isCharacterMgmtModalOpen, setIsCharacterMgmtModalOpen] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

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

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const handleOpenCharacterMgmtModal = () => {
    setIsCharacterMgmtModalOpen(true);
  }

  const handleCloseCharacterMgmtModal = () => {
    setIsCharacterMgmtModalOpen(false);
  }

  const handleOpenHealthModal = (healing = false, character = null) => {
    if (healing && character?.hp == character?.maxHp)
      showAlert('warning', t('characters.cannot_be_healed', { name: character.name }))
    else if (!healing && character?.hp == 0)
      showAlert('warning', t('characters.cannot_take_damage', { name: character.name }))
    else {
      setIsHealing(healing);
      setIsHealthModalOpen(true);
      setCharacterToEdit(character);
    }
  };

  const handleCloseHealthModal = () => {
    setIsHealthModalOpen(false);
  }

  const handleUpdateSettings = (newSettings) => {
    return;
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

      if (response.ok) {
        setCharacters([...characters, newCharacter]);
        showAlert('success', t('characters.created'));
      } else
        showAlert('error', t('characters.create_error'));
    } catch (error) {
      showAlert('error', t('characters.network_error'));
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
          showAlert('success', t('characters.deleted'));
        } else
          showAlert('error', t('characters.delete_error'));
      } catch (error) {
        showAlert('error', t('characters.network_error'));
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
        showAlert('success', t('characters.updated'));
      } else
        showAlert('error', t('characters.update_error'));
    } catch (error) {
      showAlert('error', t('characters.network_error'));
    }
  };

  return (
    <div className="App">
      <div className='navbar'>
        <button className='button' onClick={handleOpenSettingsModal}>
          <TbSettings size={iconsSize} />
          <p className='button-text'>{t('common.settings')}</p>
        </button>
      </div>
      <div className='characters'>
        <div className='header'>
          <h2 className='title'>{t('characters.title')}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className='button' onClick={handleOpenCharacterMgmtModal}>
              <TbTools size={iconsSize} />
              <p className='button-text'>{t('common.manage')}</p>
            </button>
            <button className='button' onClick={handleOpenModal}>
              <TbPlus size={iconsSize} />
              <p className='button-text'>{t('common.new')}</p>
            </button>
          </div>
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
              onHeal={() => handleOpenHealthModal(true, character)}
              onDamage={() => handleOpenHealthModal(false, character)}
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
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
        onUpdate={handleUpdateSettings}
      />
      <HealthManagementModal
        isOpen={isHealthModalOpen}
        onClose={handleCloseHealthModal}
        onUpdate={handleUpdateCharacter}
        character={characterToEdit}
        isHealing={isHealing}
      />
      <CharacterManagementModal
        isOpen={isCharacterMgmtModalOpen}
        onClose={handleCloseCharacterMgmtModal}
        characters={characters}
        onUpdateCharacters={setCharacters}
      />
    </div>
  )
}

export default App
