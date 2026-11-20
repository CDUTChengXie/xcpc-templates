# EverySG与一般无向图删边博弈

dag 为有向无环图邻接表，tokens 为各棋子所在点，编号 [0,dag.size())；Green 图 n>=1、根 [0,n)，可含重边/自环。 每步必须移动每个可动棋子，无法移动的停留，全部无法行动者输；空 tokens 为败。 Green 每步删一条边并丢弃与根不连通的部分，初始不连根的边不参与；正常规则删最后边者胜。

EverySG/Green O(n+m) 时间与空间

```cpp
namespace games_extra {
    // 每步所有可动棋子都要移动，返回先手是否胜；DAG节点[0,n)。
    bool everySG(const std::vector<std::vector<int>> &dag, const std::vector<int> &tokens) {
        int n = int(dag.size()), longest = 0;
        std::vector<int> state(n), length(n);
        struct Frame {
            int vertex;
            size_t next;
        };
        for (int root : tokens) {
            assert(root >= 0 && root < n);
            if (!state[root]) {
                state[root] = 1;
                std::vector<Frame> frames{{root, 0}};
                while (!frames.empty()) {
                    auto &frame = frames.back();
                    int vertex = frame.vertex;
                    if (frame.next < dag[vertex].size()) {
                        int next = dag[vertex][frame.next++];
                        assert(next >= 0 && next < n && state[next] != 1);
                        if (!state[next]) {
                            state[next] = 1;
                            frames.push_back({next, 0});
                        }
                    } else {
                        int minimum = INT_MAX, evenMaximum = -1;
                        for (int next : dag[vertex]) {
                            minimum = std::min(minimum, length[next]);
                            if (!(length[next] & 1))
                                evenMaximum = std::max(evenMaximum, length[next]);
                        }
                        length[vertex] = dag[vertex].empty()
                                             ? 0
                                             : (evenMaximum >= 0 ? evenMaximum + 1 : minimum + 1);
                        state[vertex] = 2;
                        frames.pop_back();
                    }
                }
            }
            longest = std::max(longest, length[root]);
        }
        return longest & 1;
    }
    // 计算根连通部分的Green Hackenbush SG；边可区分，自环可删。
    int green(int n, const std::vector<std::pair<int, int>> &edges, int root) {
        assert(n >= 1 && root >= 0 && root < n);
        int m = int(edges.size());
        std::vector<std::vector<std::pair<int, int>>> adj(n);
        for (int index = 0; index < m; ++index) {
            auto [from, to] = edges[index];
            assert(from >= 0 && from < n && to >= 0 && to < n);
            adj[from].push_back({to, index});
            adj[to].push_back({from, index});
        }
        std::vector<int> tin(n, -1), low(n);
        std::vector<bool> bridge(m);
        struct Frame {
            int vertex, edge;
            size_t next;
        };
        std::vector<Frame> frames{{root, -1, 0}};
        int timer = 0;
        tin[root] = low[root] = timer++;
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (frame.next < adj[vertex].size()) {
                auto [next, edge] = adj[vertex][frame.next++];
                if (edge == frame.edge)
                    continue;
                if (tin[next] >= 0)
                    low[vertex] = std::min(low[vertex], tin[next]);
                else {
                    tin[next] = low[next] = timer++;
                    frames.push_back({next, edge, 0});
                }
            } else {
                int edge = frame.edge;
                frames.pop_back();
                if (frames.empty())
                    continue;
                int parent = frames.back().vertex;
                low[parent] = std::min(low[parent], low[vertex]);
                if (low[vertex] > tin[parent])
                    bridge[edge] = true;
            }
        }
        std::vector<int> component(n, -1);
        int count = 0;
        for (int start = 0; start < n; ++start)
            if (tin[start] >= 0 && component[start] < 0) {
                std::vector<int> pending{start};
                component[start] = count;
                while (!pending.empty()) {
                    int vertex = pending.back();
                    pending.pop_back();
                    for (auto [next, edge] : adj[vertex])
                        if (!bridge[edge] && component[next] < 0) {
                            component[next] = count;
                            pending.push_back(next);
                        }
                }
                ++count;
            }
        std::vector<std::vector<int>> tree(count);
        std::vector<int> parity(count);
        for (int index = 0; index < m; ++index) {
            auto [from, to] = edges[index];
            if (component[from] < 0)
                continue;
            if (bridge[index]) {
                tree[component[from]].push_back(component[to]);
                tree[component[to]].push_back(component[from]);
            } else
                parity[component[from]] ^= 1;
        }
        std::vector<int> parent(count, -1), order{component[root]}, sg(count);
        for (size_t index = 0; index < order.size(); ++index) {
            int vertex = order[index];
            for (int next : tree[vertex])
                if (next != parent[vertex]) {
                    parent[next] = vertex;
                    order.push_back(next);
                }
        }
        for (auto iterator = order.rbegin(); iterator != order.rend(); ++iterator) {
            int vertex = *iterator;
            sg[vertex] = parity[vertex];
            for (int next : tree[vertex])
                if (next != parent[vertex])
                    sg[vertex] ^= sg[next] + 1;
        }
        return sg[component[root]];
    }
}
```
