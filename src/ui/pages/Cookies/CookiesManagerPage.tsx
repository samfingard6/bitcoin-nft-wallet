import Container from '@material-ui/core/Container';
import { AppBar, makeStyles, Paper, Toolbar, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import CookiesManagerList from './CookiesManagerList';
import { Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { useState } from 'react';
import { useNavigate } from '../MainRoute';
import { useCurrentKeyring } from '@/ui/state/keyrings/hooks';

const useStyles = makeStyles((theme) => ({
  container: {
    [theme.breakpoints.down(theme.ext)]: {
      padding: 0,
    },
    [theme.breakpoints.up(theme.ext)]: {
      maxWidth: 'md',
    },
  },
  balancesContainer: {
    [theme.breakpoints.down(theme.ext)]: {
      marginBottom: 24,
    },
  },
  cookiesContainer: {
    [theme.breakpoints.down(theme.ext)]: {
      padding: '0!important',
    },
  },
}));

export default function CookiesManagerPage() {
    const [connected, setConnected] = useState(false);
    const navigate = useNavigate();
  const classes = useStyles();
  const currentKeyring = useCurrentKeyring();
  return (
    <Layout>
        <Header
            LeftComponent={
            <Column>
                {connected && (
                <Row
                    itemsCenter
                    onClick={() => {
                    navigate('ConnectedSitesScreen');
                    }}>
                    <Text text="·" color="green" size="xxl" />
                    <Text text="Dapp Connected" size="xxs" />
                </Row>
                )}
            </Column>
            }
            RightComponent={
            <Card
                preset="style2"
                onClick={() => {
                navigate('SwitchKeyringScreen');
                }}>
                <Text text={currentKeyring.alianName} size="xxs" />
            </Card>
            }
        />
        <Content classname={classes.cookiesContainer}>
            <Grid container>
                <Grid item xs={12}>
                  <Paper>
                      <AppBar position="static" color="default" elevation={1}>
                      <Toolbar style={{ backgroundColor: '#156064', }}>
                          <Typography
                          variant="h6"
                          style={{ 
                            flexGrow: 1, 
                            fontSize: '20px', 
                            backgroundColor: '#156064', 
                            color: '#F4F7BE', 
                            textAlign: 'center',
                          }}
                          component="h2"
                          >
                          Cookies Manager
                          </Typography>
                      </Toolbar>
                      </AppBar>
                      <CookiesManagerList/>
                  </Paper>
                </Grid>
            </Grid>
        </Content>
        <Footer px="zero" py="zero">
            <NavTabBar tab="cookies-manager" />
        </Footer>
    </Layout>
  );
};
