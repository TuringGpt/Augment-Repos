import { useState } from 'react'
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import CheckIcon from '@mui/icons-material/Check'
import { useTranslation } from '@hooks/useTranslation'
import { LANGUAGES, LanguageCode } from '@config/i18n'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (languageCode: LanguageCode) => {
    i18n.changeLanguage(languageCode)
    handleClose()
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="change language"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        id="language-button"
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {Object.entries(LANGUAGES).map(([code, { nativeName }]) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code as LanguageCode)}
            selected={i18n.resolvedLanguage === code}
          >
            {i18n.language === code && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText inset={i18n.language !== code}>
              {nativeName}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LanguageSwitcher

