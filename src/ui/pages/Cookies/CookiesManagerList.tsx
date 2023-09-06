import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import WarningIcon from '@material-ui/icons/Warning';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

// Intl DateTime formatting settings
const intlOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

async function loadCookiesList() {
  let result = [];
  if (typeof chrome.cookies === "undefined")
    return [];

  const cookies = await chrome.cookies.getAll({});
  if (cookies.length === 0)
    return [];

  const allDomains = cookies
    .filter((value, index, self) => {
      return self.findIndex(v => v.domain === value.domain) === index;
    })
    .map((el) => el.domain);
  for (let domain of allDomains) {
    const domainCookies = await chrome.cookies.getAll({ domain });
    if (domainCookies.length && typeof domainCookies[0] !== 'undefined') {
      const newRow = createCookieData(domain, domainCookies.length, domainCookies[0].secure, !domainCookies[0].session, domainCookies);
      result.push(newRow);
    }
  }

  return result;
}

async function deleteDomainCookies(domain) {
  let cookiesDeleted = 0;
  try {
    const cookies = await chrome.cookies.getAll({ domain });

    if (cookies.length === 0) {
      return "No cookies found";
    }

    let pending = cookies.map(deleteCookie);
    await Promise.all(pending);

    cookiesDeleted = pending.length;
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `Deleted ${cookiesDeleted} cookie(s).`;
}

function deleteCookie(cookie) {
  const protocol = cookie.secure ? "https:" : "http:";
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId,
  });
}

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
  fixedCell: {
    maxWidth: '200px',
    overflow: 'hidden',
  },
});

function createCookieData(name, cookies_number, is_secure, is_persistent, cookies) {
  return { name, cookies_number, is_secure, is_persistent, cookies };
}

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'domain name', numeric: false, disablePadding: true, label: 'Domain Name' },
  { id: 'cookies number', numeric: true, disablePadding: false, label: 'Cookies Number' },
];

function EnhancedTableHead(props) {
  const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
        color: theme.palette.secondary.main,
        backgroundColor: lighten(theme.palette.secondary.light, 0.85),
      }
      : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
      },
  title: {
    flex: '1 1 100%',
  },
  deleteBtn: {
    width: '315px',
    marginRight: '10px',
    backgroundColor: '#823038',
    [theme.breakpoints.down(450)]: {
      marginBottom: '10px',
      fontSize: '12px',
    }
  },
  cookiesTableFix: {
    backgroundColor: '#156064',
    '& *': {
      color: '#F4F7BE',
      borderColor: '#F4F7BE',
    },
  },
  btnContainer: {
    flexDirection: 'row',
    [theme.breakpoints.down(450)]: {
      flexDirection: 'column',
    }
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useToolbarStyles();
  const { numSelected, handleDeleteSelectedClick, handleDeleteAllClick } = props;

  return (
    <Toolbar
      className={clsx(classes.root, classes.cookiesTableFix, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="delete"
            onClick={handleDeleteSelectedClick}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <div className={classes.btnContainer} style={{ display: 'flex',  }}>
          <Button
            className={classes.deleteBtn}
            variant="contained"
            color="secondary"
            startIcon={<WarningIcon />}
          >
            Enable Cookies Protection
          </Button>
          <Button
            className={classes.deleteBtn}
            variant="contained"
            color="secondary"
            startIcon={<BlockIcon />}
          >
            Enable Black List
          </Button>
          <Button
            className={classes.deleteBtn}
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAllClick}
          >
            Delete All
          </Button>
        </div>
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  noCookiesFound: {
    padding: '15px',
  },
  cookiesTable: {
    backgroundColor: '#156064',
    '& *': {
      color: '#F4F7BE',
      borderColor: '#F4F7BE',
    },
  },
  cookiesTableFix: {
    backgroundColor: '#156064',
    '& *': {
      color: '#F4F7BE',
      borderColor: '#F4F7BE',
    },
  }
}));

  
export default function CookiesManagerList() {
  const classes = useStyles();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [dense] = useState(true);
  const [rowsPerPage] = useState(25);
  const [rows, setRows] = useState([]);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    loadCookiesList().then(val => {
      setRows(val);
    });
  });

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleDeleteClick = (source) => {
    if (source.length)
      Promise.all(source.map(async (r) => {
        console.log(`Delete Cookies Of ${r}`);
        if (typeof r !== undefined) await deleteDomainCookies(r);
      }))
        .then(() => setSelected([]))
        .then(loadCookiesList)
        .then(val => setRows(val));
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        {(rows.length)
        ? (<>
            <EnhancedTableToolbar
              className={classes.cookiesTableFix}
              numSelected={selected.length}
              handleDeleteSelectedClick={() => handleDeleteClick(selected)}
              handleDeleteAllClick={() => {
                let source = rows.map((r) => r.name);
                console.log(source);
                handleDeleteClick(source);
              }}
            />
            <TableContainer>
              <Table
                className={clsx(classes.table, classes.cookiesTable)}
                aria-labelledby="cookieTable"
                size={dense ? 'small' : 'medium'}
                aria-label="cookie table"
                style={{ minWidth: 'auto' }}
              >
                <EnhancedTableHead
                  classes={classes}
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={rows.length}
                />
                <TableBody>
                  {stableSort(rows, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      return (<Row
                        key={index}
                        row={row}
                        handleClick={(event, name) => handleClick(event, name)}
                        isSelected={(name) => isSelected(name)} />);
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              className={classes.cookiesTableFix}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPageOptions={[25]}
            />
          </>)
        : (<Typography className={classes.noCookiesFound} variant="h6" gutterBottom>No cookies found!</Typography>)}
      </Paper>
    </div>
  );
}

function Row(props) {
  const { row, handleClick, isSelected, key } = props;
  const [open, setOpen] = useState(false);
  const classes = useRowStyles();
  const isItemSelected = isSelected(row.name);
  const labelId = `enhanced-table-checkbox-${key}`;

  return (
    <React.Fragment>
      <TableRow
        hover
        role="checkbox"
        aria-checked={isItemSelected}
        tabIndex={-1}
        key={row.name}
        selected={isItemSelected}
        className={classes.root}
      >
        <TableCell component="th" id={labelId} scope="row" padding="normal">
          <Box fontWeight={700}>{row.name}</Box>
        </TableCell>
        <TableCell align="right">{row.cookies_number}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Domain Cookies
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>httpOnly</TableCell>
                    <TableCell>hostOnly</TableCell>
                    <TableCell>expirationDate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.cookies.map((cookie, index) => {
                    return (
                      <TableRow
                        hover
                        tabIndex={-1}
                        key={index}
                        className={classes.root}
                      >
                        <TableCell className={classes.fixedCell}>{cookie.name}</TableCell>
                        <TableCell className={classes.fixedCell}>{cookie.path}</TableCell>
                        <TableCell className={classes.fixedCell}>{cookie.value}</TableCell>
                        <TableCell>{String(cookie.httpOnly)}</TableCell>
                        <TableCell>{String(cookie.hostOnly)}</TableCell>
                        {(typeof cookie.expirationDate !== 'undefined')
                          ? (<TableCell>{new Intl.DateTimeFormat('en-US', intlOptions).format(new Date(cookie.expirationDate * 1000))}</TableCell>)
                          : (<></>)}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
