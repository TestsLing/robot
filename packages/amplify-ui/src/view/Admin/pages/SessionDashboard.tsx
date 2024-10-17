import {
  BarChart,
  Box,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  Grid,
  Header,
  LineChart,
  Link,
  StatusIndicator,
} from "@cloudscape-design/components";
import { Box as MBox } from "@mui/material";
import { useParams } from "react-router-dom";

export const SessionDashboard = () => {
  const { SessionID } = useParams();

  return (
    <ContentLayout
      header={
        <MBox pl={5} pb={2} pt={3}>
          <Header
            variant="h1"
            description={`Make neccessary updates to Session: ${SessionID}`}
          >
            Sessions Dashboard
          </Header>
        </MBox>
      }
    >
      <MBox px={5}>
        <Grid
          gridDefinition={[
            { colspan: { l: 8, m: 8, default: 12 } },
            { colspan: { l: 4, m: 4, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 6, m: 6, default: 12 } },
            { colspan: { l: 8, m: 8, default: 12 } },
            { colspan: { l: 4, m: 4, default: 12 } },
          ]}
        >
          <Container
            header={
              <Header
                variant="h2"
                description="Viewing data from N. Virginia region"
              >
                Service overview - <em>new</em>
              </Header>
            }
            fitHeight={true}
          >
            <ServiceOverview />
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description="Viewing data from N. Virginia region"
              >
                Service overview - <em>new</em>
              </Header>
            }
            fitHeight={true}
          >
            <ServiceHealthContent />
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description="Daily instance hours by instance type"
              >
                Instance hours
              </Header>
            }
            fitHeight={true}
          >
            <OperationalMetricsContent />
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                description="Incoming and outgoing network traffic"
              >
                Network traffic
              </Header>
            }
            fitHeight={true}
          >
            <LineChartContent />
          </Container>
        </Grid>
      </MBox>
    </ContentLayout>
  );
};

const ServiceOverview = () => {
  return (
    <ColumnLayout columns={4} variant="text-grid" minColumnWidth={170}>
      <div>
        <Box variant="awsui-key-label">Running instances</Box>
        <Link variant="awsui-value-large" href="#">
          14
        </Link>
      </div>
      <div>
        <Box variant="awsui-key-label">Volumes</Box>
        <Link variant="awsui-value-large" href="#">
          126
        </Link>
      </div>
      <div>
        <Box variant="awsui-key-label">Security groups</Box>
        <Link variant="awsui-value-large" href="#">
          116
        </Link>
      </div>
      <div>
        <Box variant="awsui-key-label">Load balancers</Box>
        <Link variant="awsui-value-large" href="#">
          28
        </Link>
      </div>
    </ColumnLayout>
  );
};

const ServiceHealthContent = () => {
  return (
    <ColumnLayout columns={2}>
      <div>
        <Box variant="awsui-key-label">Region</Box>
        <div>US East (N. Virginia)</div>
      </div>
      <div>
        <Box variant="awsui-key-label">Status</Box>
        <StatusIndicator type="success">
          Service is operating normally
        </StatusIndicator>
      </div>
    </ColumnLayout>
  );
};

const OperationalMetricsContent = () => {
  return (
    <BarChart
      series={[
        {
          title: "Severe",
          type: "bar",
          data: [
            { x: new Date(1601103600000), y: 12 },
            { x: new Date(1601110800000), y: 18 },
            { x: new Date(1601118000000), y: 15 },
            { x: new Date(1601125200000), y: 9 },
            { x: new Date(1601132400000), y: 18 },
          ],
        },
        {
          title: "Moderate",
          type: "bar",
          data: [
            { x: new Date(1601103600000), y: 8 },
            { x: new Date(1601110800000), y: 11 },
            { x: new Date(1601118000000), y: 12 },
            { x: new Date(1601125200000), y: 11 },
            { x: new Date(1601132400000), y: 13 },
          ],
        },
        {
          title: "Low",
          type: "bar",
          data: [
            { x: new Date(1601103600000), y: 7 },
            { x: new Date(1601110800000), y: 9 },
            { x: new Date(1601118000000), y: 8 },
            { x: new Date(1601125200000), y: 7 },
            { x: new Date(1601132400000), y: 5 },
          ],
        },
        {
          title: "Unclassified",
          type: "bar",
          data: [
            { x: new Date(1601103600000), y: 14 },
            { x: new Date(1601110800000), y: 8 },
            { x: new Date(1601118000000), y: 6 },
            { x: new Date(1601125200000), y: 4 },
            { x: new Date(1601132400000), y: 6 },
          ],
        },
      ]}
      xDomain={[
        new Date(1601103600000),
        new Date(1601110800000),
        new Date(1601118000000),
        new Date(1601125200000),
        new Date(1601132400000),
      ]}
      yDomain={[0, 50]}
      i18nStrings={{
        xTickFormatter: (e) =>
          e
            .toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: !1,
            })
            .split(",")
            .join("\n"),
      }}
      ariaLabel="Stacked bar chart"
      height={300}
      stackedBars
      xTitle="Time (UTC)"
      yTitle="Error count"
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
          <Box variant="p" color="inherit">
            There is no data available
          </Box>
        </Box>
      }
      noMatch={
        <Box textAlign="center" color="inherit">
          <b>No matching data</b>
          <Box variant="p" color="inherit">
            There is no matching data to display
          </Box>
          <Button>Clear filter</Button>
        </Box>
      }
    />
  );
};

const LineChartContent = () => {
  return (
    <LineChart
      series={[
        {
          title: "Site 1",
          type: "line",
          data: [
            { x: new Date(1601017200000), y: 58020 },
            { x: new Date(1601018100000), y: 102402 },
            { x: new Date(1601019000000), y: 104920 },
            { x: new Date(1601019900000), y: 94031 },
            { x: new Date(1601020800000), y: 125021 },
            { x: new Date(1601021700000), y: 159219 },
            { x: new Date(1601022600000), y: 193082 },
            { x: new Date(1601023500000), y: 162592 },
            { x: new Date(1601024400000), y: 274021 },
            { x: new Date(1601025300000), y: 264286 },
            { x: new Date(1601026200000), y: 289210 },
            { x: new Date(1601027100000), y: 256362 },
            { x: new Date(1601028000000), y: 257306 },
            { x: new Date(1601028900000), y: 186776 },
            { x: new Date(1601029800000), y: 294020 },
            { x: new Date(1601030700000), y: 385975 },
            { x: new Date(1601031600000), y: 486039 },
            { x: new Date(1601032500000), y: 490447 },
            { x: new Date(1601033400000), y: 361845 },
            { x: new Date(1601034300000), y: 339058 },
            { x: new Date(1601035200000), y: 298028 },
            { x: new Date(1601036100000), y: 231902 },
            { x: new Date(1601037000000), y: 224558 },
            { x: new Date(1601037900000), y: 253901 },
            { x: new Date(1601038800000), y: 102839 },
            { x: new Date(1601039700000), y: 234943 },
            { x: new Date(1601040600000), y: 204405 },
            { x: new Date(1601041500000), y: 190391 },
            { x: new Date(1601042400000), y: 183570 },
            { x: new Date(1601043300000), y: 162592 },
            { x: new Date(1601044200000), y: 148910 },
            { x: new Date(1601045100000), y: 229492 },
            { x: new Date(1601046000000), y: 293910 },
          ],
          valueFormatter: function o(e) {
            return Math.abs(e) >= 1e9
              ? (e / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
              : Math.abs(e) >= 1e6
              ? (e / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
              : Math.abs(e) >= 1e3
              ? (e / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
              : e.toFixed(2);
          },
        },
        {
          title: "Site 2",
          type: "line",
          data: [
            { x: new Date(1601017200000), y: 151023 },
            { x: new Date(1601018100000), y: 169975 },
            { x: new Date(1601019000000), y: 176980 },
            { x: new Date(1601019900000), y: 168852 },
            { x: new Date(1601020800000), y: 149130 },
            { x: new Date(1601021700000), y: 147299 },
            { x: new Date(1601022600000), y: 169552 },
            { x: new Date(1601023500000), y: 163401 },
            { x: new Date(1601024400000), y: 154091 },
            { x: new Date(1601025300000), y: 199516 },
            { x: new Date(1601026200000), y: 195503 },
            { x: new Date(1601027100000), y: 189953 },
            { x: new Date(1601028000000), y: 181635 },
            { x: new Date(1601028900000), y: 192975 },
            { x: new Date(1601029800000), y: 205951 },
            { x: new Date(1601030700000), y: 218958 },
            { x: new Date(1601031600000), y: 220516 },
            { x: new Date(1601032500000), y: 213557 },
            { x: new Date(1601033400000), y: 165899 },
            { x: new Date(1601034300000), y: 173557 },
            { x: new Date(1601035200000), y: 172331 },
            { x: new Date(1601036100000), y: 186492 },
            { x: new Date(1601037000000), y: 131541 },
            { x: new Date(1601037900000), y: 142262 },
            { x: new Date(1601038800000), y: 194091 },
            { x: new Date(1601039700000), y: 185899 },
            { x: new Date(1601040600000), y: 173401 },
            { x: new Date(1601041500000), y: 171635 },
            { x: new Date(1601042400000), y: 179130 },
            { x: new Date(1601043300000), y: 185951 },
            { x: new Date(1601044200000), y: 144091 },
            { x: new Date(1601045100000), y: 152975 },
            { x: new Date(1601046000000), y: 157299 },
          ],
          valueFormatter: function o(e) {
            return Math.abs(e) >= 1e9
              ? (e / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
              : Math.abs(e) >= 1e6
              ? (e / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
              : Math.abs(e) >= 1e3
              ? (e / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
              : e.toFixed(2);
          },
        },
        {
          title: "Performance goal",
          type: "threshold",
          y: 250000,
          valueFormatter: function o(e) {
            return Math.abs(e) >= 1e9
              ? (e / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
              : Math.abs(e) >= 1e6
              ? (e / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
              : Math.abs(e) >= 1e3
              ? (e / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
              : e.toFixed(2);
          },
        },
      ]}
      xDomain={[new Date(1601017200000), new Date(1601046000000)]}
      yDomain={[0, 500000]}
      i18nStrings={{
        xTickFormatter: (e) =>
          e
            .toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: !1,
            })
            .split(",")
            .join("\n"),
        yTickFormatter: function o(e) {
          return Math.abs(e) >= 1e9
            ? (e / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
            : Math.abs(e) >= 1e6
            ? (e / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
            : Math.abs(e) >= 1e3
            ? (e / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
            : e.toFixed(2);
        },
      }}
      ariaLabel="Multiple data series line chart"
      height={300}
      xScaleType="time"
      xTitle="Time (UTC)"
      yTitle="Bytes transferred"
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
          <Box variant="p" color="inherit">
            There is no data available
          </Box>
        </Box>
      }
      noMatch={
        <Box textAlign="center" color="inherit">
          <b>No matching data</b>
          <Box variant="p" color="inherit">
            There is no matching data to display
          </Box>
          <Button>Clear filter</Button>
        </Box>
      }
    />
  );
};
